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
from typing import Any, Dict, List, Tuple, Optional

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Mode detection ─────────────────────────────────────────────────────────

def is_hf_api_mode() -> bool:
    """Return True if HF Space API mode is active."""
    return bool(
        settings.USE_HF_API
        or (settings.HF_API_URL and str(settings.HF_API_URL).strip())
        or os.getenv("USE_HF_API", "false").lower() == "true"
    )


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
    The Space exposes a /predict endpoint that accepts base64 image
    and returns {fake_probability, real_probability}.
    """
    import httpx

    hf_url = settings.HF_API_URL or os.getenv("HF_API_URL", "")
    hf_token = settings.HF_API_TOKEN or os.getenv("HF_API_TOKEN", "")

    if not hf_url:
        raise RuntimeError(
            "HF_API_URL is not set. Please provide your Hugging Face Space URL in environment variables "
            "(e.g. HF_API_URL=https://dinesh-18-aiml-deepvision-inference.hf.space)"
        )

    t0 = time.perf_counter()

    # Encode image as base64
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    headers = {"Content-Type": "application/json"}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"

    payload = {"data": [{"image": b64}]}

    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(f"{hf_url.rstrip('/')}/predict", json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
    except httpx.TimeoutException:
        raise RuntimeError("HF Model Space API timed out. The space may be starting up — please retry in 30 seconds.")
    except Exception as e:
        raise RuntimeError(f"HF Model Space API error: {e}")

    inference_ms = int((time.perf_counter() - t0) * 1000)

    # Parse response
    data = result.get("data", [{}])
    if isinstance(data, list) and len(data) > 0:
        pred = data[0]
    elif isinstance(data, dict):
        pred = data
    else:
        pred = result

    fake_prob = float(pred.get("fake_probability", pred.get("fake", 0.5)))
    real_prob = float(pred.get("real_probability", pred.get("real", 1.0 - fake_prob)))

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
        "api_url": hf_url,
    }

    return round(confidence, 4), verdict, details


def _predict_hf_image(image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """Crop face and forward to the remote Model API."""
    face_detected = False
    face_bbox = []
    send_bytes = image_bytes
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        eval_image, face_detected, face_bbox = _detect_and_crop_face(image)
        buf = io.BytesIO()
        eval_image.save(buf, format="JPEG", quality=95)
        send_bytes = buf.getvalue()
    except Exception as e:
        logger.debug(f"Preprocessing note for HF image: {e}")

    conf, verdict, details = _call_hf_api(send_bytes)
    details["face_detected"] = face_detected
    details["face_bbox"] = face_bbox
    return conf, verdict, details


def _predict_hf_video(video_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """Extract sample frames with OpenCV and classify via remote Model API."""
    t0 = time.perf_counter()
    raw_frames = _extract_video_frames(video_bytes, settings.VIDEO_SAMPLE_FRAMES)
    if not raw_frames:
        raise RuntimeError("Unable to extract frames from video.")

    fake_probs = []
    frame_results = []

    for i, frame in enumerate(raw_frames):
        try:
            pil_img = Image.fromarray(frame)
            crop_img, _, _ = _detect_and_crop_face(pil_img)
            buf = io.BytesIO()
            crop_img.save(buf, format="JPEG", quality=90)
            _, _, details = _call_hf_api(buf.getvalue())
            fp = float(details.get("fake_probability", 0.5))
        except Exception as e:
            logger.warning(f"Frame {i} inference note: {e}")
            fp = 0.5

        fake_probs.append(fp)
        frame_results.append({
            "frame_index": i,
            "fake_probability": round(fp, 4),
            "verdict": "FAKE" if fp >= settings.CONFIDENCE_THRESHOLD else "REAL"
        })

    inference_ms = int((time.perf_counter() - t0) * 1000)
    avg_fake = float(np.mean(fake_probs)) if fake_probs else 0.5
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
        "mode": "hf_api",
    }


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


# ── Public API ─────────────────────────────────────────────────────────────

def predict_image(image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """
    Detect deepfake in an image.
    Uses remote HF Model API if configured, otherwise falls back to local PyTorch.
    """
    if is_hf_api_mode():
        logger.info(f"Running image deepfake detection via remote Model API (HF_API_URL={settings.HF_API_URL or os.getenv('HF_API_URL')}).")
        return _predict_hf_image(image_bytes)

    logger.info("Running deepfake detection with local HybridViTCNN model.")
    return _predict_local_image(image_bytes)


def predict_video(video_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """
    Detect deepfake in a video.
    Uses remote HF Model API if configured, otherwise falls back to local PyTorch.
    """
    if is_hf_api_mode():
        logger.info(f"Running video deepfake detection via remote Model API (HF_API_URL={settings.HF_API_URL or os.getenv('HF_API_URL')}).")
        return _predict_hf_video(video_bytes)

    logger.info("Running video deepfake detection with local HybridViTCNN model.")
    return _predict_local_video(video_bytes)

