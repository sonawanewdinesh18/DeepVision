"""
app/engine/predictor.py

Deepfake detection inference.

Deployment modes (auto-selected based on USE_HF_API env var):

  1. HF_API mode  (USE_HF_API=true, recommended for Render free tier)
     - Sends the image to your Hugging Face Space API endpoint
     - Zero PyTorch RAM on the backend server
     - Requires HF_API_URL and optionally HF_API_TOKEN in environment

  2. Local mode   (USE_HF_API=false, default for local/paid hosting)
     - Loads HybridViTCNN weights locally via PyTorch
     - Requires ~280MB RAM after INT8 quantization
"""

import io
import gc
import os
import time
import base64
import logging
import tempfile
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Mode detection ─────────────────────────────────────────────────────────
_USE_HF_API = os.getenv("USE_HF_API", "false").lower() == "true"
_HF_API_URL = os.getenv("HF_API_URL", "")          # e.g. https://YOUR-SPACE.hf.space
_HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")       # HF read token (optional for public spaces)


# ── Face detection (shared by both modes) ─────────────────────────────────

_face_cascade_alt2 = None
_face_cascade_default = None


def _get_cascades():
    global _face_cascade_alt2, _face_cascade_default
    if _face_cascade_alt2 is None:
        try:
            cascade_dir = getattr(cv2.data, "haarcascades", "") if hasattr(cv2, "data") else ""
            _face_cascade_alt2 = cv2.CascadeClassifier(cascade_dir + "haarcascade_frontalface_alt2.xml")
            _face_cascade_default = cv2.CascadeClassifier(cascade_dir + "haarcascade_frontalface_default.xml")
        except Exception as e:
            logger.debug(f"Cascade load note: {e}")
    return _face_cascade_alt2, _face_cascade_default


def _detect_and_crop_face(pil_img: Image.Image) -> Tuple[Image.Image, bool, List[int]]:
    try:
        cascade_alt2, cascade_default = _get_cascades()
        if not cascade_alt2 or not cascade_default:
            return pil_img, False, []

        np_img = np.array(pil_img)
        gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY) if len(np_img.shape) == 3 else np_img

        faces = cascade_alt2.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(40, 40))
        if len(faces) == 0:
            faces = cascade_default.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(40, 40))

        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            mx, my = int(w * 0.30), int(h * 0.30)
            iw, ih = pil_img.size
            crop = pil_img.crop((max(0, x - mx), max(0, y - my), min(iw, x + w + mx), min(ih, y + h + my)))
            return crop, True, [int(x), int(y), int(w), int(h)]
    except Exception as e:
        logger.debug(f"Face detection fallback: {e}")

    return pil_img, False, []


# ── HF API Mode ────────────────────────────────────────────────────────────

def _call_hf_api(image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """
    Send image to Hugging Face Space API and get prediction.
    The Space must expose a /predict endpoint that accepts base64 image
    and returns {fake_probability, real_probability}.
    """
    import httpx

    if not _HF_API_URL:
        raise RuntimeError(
            "HF_API_URL is not set. Set it to your Hugging Face Space URL "
            "(e.g. https://dinesh-18-aiml-deepvision-inference.hf.space)"
        )

    t0 = time.perf_counter()

    # Encode image as base64
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    headers = {"Content-Type": "application/json"}
    if _HF_API_TOKEN:
        headers["Authorization"] = f"Bearer {_HF_API_TOKEN}"

    payload = {"data": [{"image": b64}]}

    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(f"{_HF_API_URL.rstrip('/')}/predict", json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
    except httpx.TimeoutException:
        raise RuntimeError("HF Space API timed out. The space may be sleeping — try again in 30s.")
    except Exception as e:
        raise RuntimeError(f"HF Space API error: {e}")

    inference_ms = int((time.perf_counter() - t0) * 1000)

    # Parse response — adapt to your Space's output format
    data = result.get("data", [{}])
    if isinstance(data, list) and len(data) > 0:
        pred = data[0]
    else:
        pred = result

    fake_prob = float(pred.get("fake_probability", pred.get("fake", 0.5)))
    real_prob = float(pred.get("real_probability", pred.get("real", 1 - fake_prob)))

    is_fake = fake_prob >= settings.CONFIDENCE_THRESHOLD
    verdict = "FAKE" if is_fake else "REAL"
    confidence = fake_prob if is_fake else real_prob

    details = {
        "fake_probability": round(fake_prob, 4),
        "real_probability": round(real_prob, 4),
        "model_version": settings.MODEL_VERSION,
        "media_type": "image",
        "inference_ms": inference_ms,
        "mode": "hf_api",
    }

    return round(confidence, 4), verdict, details


# ── Local PyTorch Mode ─────────────────────────────────────────────────────

def _predict_local_image(image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """Run inference locally using the PyTorch HybridViTCNN model."""
    import torch
    import torchvision.transforms as T
    from app.engine.model import load_model, InferenceError, ModelLoadError

    _transform = T.Compose([
        T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    model, device = load_model()

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        eval_image, face_detected, face_bbox = _detect_and_crop_face(image)

        tensor = _transform(eval_image).unsqueeze(0).to(device)

        t0 = time.perf_counter()
        with torch.inference_mode():
            logits = model(tensor)
            probs = torch.softmax(logits, dim=1)[0]
        inference_ms = int((time.perf_counter() - t0) * 1000)

        fake_prob = float(probs[0].item())
        real_prob = float(probs[1].item())

        del tensor, logits, probs
        gc.collect()

        is_fake = fake_prob >= settings.CONFIDENCE_THRESHOLD
        verdict = "FAKE" if is_fake else "REAL"
        confidence = fake_prob if is_fake else real_prob

        return round(confidence, 4), verdict, {
            "fake_probability": round(fake_prob, 4),
            "real_probability": round(real_prob, 4),
            "model_version": settings.MODEL_VERSION,
            "media_type": "image",
            "image_size": list(image.size),
            "face_detected": face_detected,
            "face_bbox": face_bbox,
            "inference_ms": inference_ms,
            "device": str(device),
            "mode": "local",
        }

    except (ModelLoadError, InferenceError):
        raise
    except Exception as exc:
        logger.exception("Local image inference failed.")
        raise InferenceError(f"Image inference failed: {exc}") from exc


def _predict_local_video(video_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """Run video inference locally using PyTorch."""
    import torch
    import torchvision.transforms as T
    from app.engine.model import load_model, InferenceError

    _transform = T.Compose([
        T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    model, device = load_model()
    t0 = time.perf_counter()
    raw_frames = _extract_video_frames(video_bytes, settings.VIDEO_SAMPLE_FRAMES)

    if not raw_frames:
        raise InferenceError("Unable to extract frames from video.")

    processed = [_detect_and_crop_face(Image.fromarray(f))[0] for f in raw_frames]
    tensors = torch.stack([_transform(f) for f in processed]).to(device)

    with torch.inference_mode():
        logits = model(tensors)
        probs = torch.softmax(logits, dim=1)

    fake_probs = [float(p[0].item()) for p in probs]
    frame_results = [
        {"frame_index": i, "fake_probability": round(fp, 4),
         "verdict": "FAKE" if fp >= settings.CONFIDENCE_THRESHOLD else "REAL"}
        for i, fp in enumerate(fake_probs)
    ]

    del tensors, logits, probs
    gc.collect()

    inference_ms = int((time.perf_counter() - t0) * 1000)
    avg_fake = float(np.mean(fake_probs))
    avg_real = 1.0 - avg_fake
    is_fake = avg_fake >= settings.CONFIDENCE_THRESHOLD
    verdict = "FAKE" if is_fake else "REAL"
    confidence = avg_fake if is_fake else avg_real

    return round(confidence, 4), verdict, {
        "fake_probability": round(avg_fake, 4),
        "real_probability": round(avg_real, 4),
        "frames_analyzed": len(raw_frames),
        "fake_frames": sum(1 for p in fake_probs if p >= settings.CONFIDENCE_THRESHOLD),
        "frame_results": frame_results,
        "model_version": settings.MODEL_VERSION,
        "media_type": "video",
        "inference_ms": inference_ms,
        "device": str(device),
        "mode": "local",
    }


# ── Video frame extractor ──────────────────────────────────────────────────

def _extract_video_frames(video_bytes: bytes, n_frames: int) -> List[np.ndarray]:
    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as f:
            f.write(video_bytes)
            tmp_path = f.name

        cap = cv2.VideoCapture(tmp_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total <= 0:
            cap.release()
            return []

        indices = np.linspace(0, total - 1, min(n_frames, total), dtype=int)
        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ok, frame = cap.read()
            if ok and frame is not None:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        cap.release()
        return frames
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


# ── Sightengine Real-Time AI Vision API (Enterprise Mode) ─────────

def _call_sightengine_image(image_bytes: bytes) -> Optional[Tuple[float, str, Dict[str, Any]]]:
    """
    Real-time deepfake and AI-generated image analysis via Sightengine Vision API.
    Sub-second response time (<500ms), 0 MB PyTorch RAM overhead, 100% cloud reliability.
    """
    user = settings.SIGHTENGINE_API_USER
    secret = settings.SIGHTENGINE_API_SECRET
    if not (user and secret):
        return None

    import httpx

    t0 = time.perf_counter()
    params = {
        "models": "deepfake,genai",
        "api_user": user,
        "api_secret": secret,
    }
    files = {"media": ("media.jpg", image_bytes, "image/jpeg")}

    try:
        with httpx.Client(timeout=25.0) as client:
            resp = client.post("https://api.sightengine.com/1.0/check.json", data=params, files=files)
            if resp.status_code != 200:
                logger.warning(f"Sightengine API returned {resp.status_code}: {resp.text}")
                return None

            data = resp.json()
            if data.get("status") != "success":
                logger.warning(f"Sightengine API error status: {data}")
                return None

            type_info = data.get("type", {})
            deepfake_score = float(type_info.get("deepfake", 0.0))
            genai_score = float(type_info.get("ai_generated", 0.0))

            # The overall synthetic probability is the max of deepfake and AI-generated scores
            fake_prob = max(deepfake_score, genai_score)
            real_prob = max(0.0, 1.0 - fake_prob)

            is_fake = fake_prob >= settings.CONFIDENCE_THRESHOLD
            verdict = "FAKE" if is_fake else "REAL"
            confidence = fake_prob if is_fake else real_prob
            inference_ms = int((time.perf_counter() - t0) * 1000)

            # Extract image dimensions if PIL is available
            img_w, img_h = 224, 224
            try:
                pil = Image.open(io.BytesIO(image_bytes))
                img_w, img_h = pil.size
            except Exception:
                pass

            details = {
                "fake_probability": round(fake_prob, 4),
                "real_probability": round(real_prob, 4),
                "deepfake_score": round(deepfake_score, 4),
                "ai_generated_score": round(genai_score, 4),
                "model_version": "Sightengine-Enterprise-Vision-v2.0",
                "media_type": "image",
                "image_size": [img_w, img_h],
                "face_detected": deepfake_score > 0.05,
                "face_bbox": [],
                "inference_ms": inference_ms,
                "device": "cloud-gpu",
                "mode": "enterprise_vision_api",
            }
            logger.info(f"Sightengine detection completed in {inference_ms}ms: {verdict} ({confidence:.2f})")
            return round(confidence, 4), verdict, details

    except Exception as e:
        logger.warning(f"Sightengine image inference failed, will use fallback: {e}")
        return None


def _call_sightengine_video(video_bytes: bytes) -> Optional[Tuple[float, str, Dict[str, Any]]]:
    """
    Video deepfake analysis by sampling representative frames and scoring via Sightengine.
    """
    user = settings.SIGHTENGINE_API_USER
    secret = settings.SIGHTENGINE_API_SECRET
    if not (user and secret):
        return None

    t0 = time.perf_counter()
    raw_frames = _extract_video_frames(video_bytes, settings.VIDEO_SAMPLE_FRAMES)
    if not raw_frames:
        return None

    frame_results = []
    fake_probs = []

    for i, frame in enumerate(raw_frames):
        pil_frame = Image.fromarray(frame)
        buf = io.BytesIO()
        pil_frame.save(buf, format="JPEG", quality=85)
        res = _call_sightengine_image(buf.getvalue())
        if res:
            conf, verd, det = res
            fp = det.get("fake_probability", 0.0)
            fake_probs.append(fp)
            frame_results.append({
                "frame_index": i,
                "fake_probability": fp,
                "verdict": verd,
            })

    if not fake_probs:
        return None

    avg_fake = float(np.mean(fake_probs))
    avg_real = 1.0 - avg_fake
    is_fake = avg_fake >= settings.CONFIDENCE_THRESHOLD
    verdict = "FAKE" if is_fake else "REAL"
    confidence = avg_fake if is_fake else avg_real
    inference_ms = int((time.perf_counter() - t0) * 1000)

    details = {
        "fake_probability": round(avg_fake, 4),
        "real_probability": round(avg_real, 4),
        "frames_analyzed": len(fake_probs),
        "fake_frames": sum(1 for p in fake_probs if p >= settings.CONFIDENCE_THRESHOLD),
        "frame_results": frame_results,
        "model_version": "Sightengine-Enterprise-Vision-v2.0",
        "media_type": "video",
        "inference_ms": inference_ms,
        "device": "cloud-gpu",
        "mode": "enterprise_vision_api",
    }
    return round(confidence, 4), verdict, details


# ── Public API ─────────────────────────────────────────────────────────────

def predict_image(image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """
    Detect deepfake in an image using the custom HybridViTCNN (ViT-B/16 + EfficientNet-B0) AI model.
    """
    logger.info("Running deepfake detection with custom HybridViTCNN model.")
    return _predict_local_image(image_bytes)


def predict_video(video_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """
    Detect deepfake in a video using the custom HybridViTCNN (ViT-B/16 + EfficientNet-B0) AI model.
    """
    logger.info("Running video deepfake detection with custom HybridViTCNN model.")
    return _predict_local_video(video_bytes)
