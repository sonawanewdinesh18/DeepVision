"""
app/engine/predictor.py

Inference routines for image and video deepfake classification.
Uses PyTorch HybridViTCNN with dual-cascade face localization and standard ImageNet normalization.
"""

import os
import io
import gc
import time
import tempfile
import logging
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np
import torch
import torchvision.transforms as T
from PIL import Image

from app.core.config import settings
from app.engine.model import load_model, InferenceError, ModelLoadError

logger = logging.getLogger(__name__)

# Full-frame bicubic resize to 224x224 matching ViT and EfficientNet input size
_transform = T.Compose([
    T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC),
    T.ToTensor(),
    T.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# Dual OpenCV Face Cascades for maximum recall on portraits, tilted, and smiling faces
_face_cascade_alt2 = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml")
_face_cascade_default = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def _detect_and_crop_face(pil_img: Image.Image) -> Tuple[Image.Image, bool, List[int]]:
    """
    Detect the primary face in the image using dual-cascade ensemble and crop it with 30% margin.
    Ensures the HybridViTCNN processes the facial region matching its training distribution.
    """
    try:
        np_img = np.array(pil_img)
        if len(np_img.shape) == 2:
            gray = np_img
        elif np_img.shape[2] == 4:
            # Handle RGBA images
            gray = cv2.cvtColor(np_img, cv2.COLOR_RGBA2GRAY)
        else:
            gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

        # 1. First attempt: alt2 cascade (higher accuracy on realistic faces)
        faces = _face_cascade_alt2.detectMultiScale(
            gray,
            scaleFactor=1.08,
            minNeighbors=4,
            minSize=(40, 40),
        )

        # 2. Fallback attempt: default cascade
        if len(faces) == 0:
            faces = _face_cascade_default.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=3,
                minSize=(40, 40),
            )

        if len(faces) > 0:
            # Select the largest detected face by area
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            
            # Add 30% contextual margin around the face to preserve hair, chin, and boundary
            margin_x = int(w * 0.30)
            margin_y = int(h * 0.30)
            
            img_w, img_h = pil_img.size
            x1 = max(0, x - margin_x)
            y1 = max(0, y - margin_y)
            x2 = min(img_w, x + w + margin_x)
            y2 = min(img_h, y + h + margin_y)
            
            face_crop = pil_img.crop((x1, y1, x2, y2))
            return face_crop, True, [int(x), int(y), int(w), int(h)]
            
    except Exception as e:
        logger.debug(f"Face detection fallback: {e}")

    return pil_img, False, []


def predict_image(image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """
    Execute deepfake detection on a single image byte string.

    Returns:
        confidence: float (0.0 to 1.0)
        verdict: "REAL" or "FAKE"
        details: forensic metadata dictionary
    """
    model, device = load_model()

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Crop face if present for optimal model evaluation
        eval_image, face_detected, face_bbox = _detect_and_crop_face(image)
        
        tensor = _transform(eval_image).unsqueeze(0).to(device)  # Shape: [1, 3, 224, 224]

        start_time = time.perf_counter()
        with torch.inference_mode():
            logits = model(tensor)
            probabilities = torch.softmax(logits, dim=1)[0]
        inference_ms = int((time.perf_counter() - start_time) * 1000)

        # Class 0: Fake, Class 1: Real (from ImageFolder dataset mapping: {'fake': 0, 'real': 1})
        fake_prob = float(probabilities[0].item())
        real_prob = float(probabilities[1].item())

        del tensor, logits, probabilities
        gc.collect()

        is_fake = fake_prob >= settings.CONFIDENCE_THRESHOLD
        verdict = "FAKE" if is_fake else "REAL"
        confidence = fake_prob if is_fake else real_prob

        details = {
            "fake_probability": round(fake_prob, 4),
            "real_probability": round(real_prob, 4),
            "model_version": settings.MODEL_VERSION,
            "media_type": "image",
            "image_size": list(image.size),
            "face_detected": face_detected,
            "face_bbox": face_bbox,
            "inference_ms": inference_ms,
            "device": str(device),
        }

        return round(confidence, 4), verdict, details

    except (ModelLoadError, InferenceError):
        raise
    except Exception as exc:
        logger.exception("Failed to run image inference.")
        raise InferenceError(f"Image inference failed: {exc}") from exc


def _extract_video_frames(video_bytes: bytes, n_frames: int) -> List[np.ndarray]:
    """
    Extract n_frames evenly-spaced frames from video bytes using OpenCV.
    Returns RGB numpy arrays of shape (H, W, 3).
    """
    tmp_path: str = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as f:
            f.write(video_bytes)
            tmp_path = f.name

        cap = cv2.VideoCapture(tmp_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            cap.release()
            return []

        # Calculate evenly spaced frame indices
        sample_count = min(n_frames, total_frames)
        indices = np.linspace(0, total_frames - 1, sample_count, dtype=int)
        
        frames: List[np.ndarray] = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            success, frame = cap.read()
            if success and frame is not None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(rgb_frame)

        cap.release()
        return frames

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


def predict_video(video_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
    """
    Execute deepfake detection across sampled frames of a video.

    Returns:
        confidence: float (0.0 to 1.0)
        verdict: "REAL" or "FAKE"
        details: frame-by-frame breakdown and aggregate scores
    """
    model, device = load_model()

    start_time = time.perf_counter()
    raw_frames = _extract_video_frames(video_bytes, settings.VIDEO_SAMPLE_FRAMES)

    if not raw_frames:
        raise InferenceError("Unable to decode or extract frames from the uploaded video.")

    processed_frames: List[Image.Image] = []
    for frame_arr in raw_frames:
        pil_frame = Image.fromarray(frame_arr)
        cropped_frame, _, _ = _detect_and_crop_face(pil_frame)
        processed_frames.append(cropped_frame)

    fake_probs: List[float] = []
    frame_results: List[Dict[str, Any]] = []

    # Batch transform frames for efficient inference
    tensors = torch.stack([
        _transform(f) for f in processed_frames
    ]).to(device)

    with torch.inference_mode():
        logits = model(tensors)
        probs = torch.softmax(logits, dim=1)

    for i, p in enumerate(probs):
        fake_p = float(p[0].item())  # Class 0: Fake
        fake_probs.append(fake_p)
        frame_results.append({
            "frame_index": i,
            "fake_probability": round(fake_p, 4),
            "verdict": "FAKE" if fake_p >= settings.CONFIDENCE_THRESHOLD else "REAL",
        })

    del tensors, logits, probs
    gc.collect()

    inference_ms = int((time.perf_counter() - start_time) * 1000)
    avg_fake = float(np.mean(fake_probs))
    avg_real = 1.0 - avg_fake

    is_fake = avg_fake >= settings.CONFIDENCE_THRESHOLD
    verdict = "FAKE" if is_fake else "REAL"
    confidence = avg_fake if is_fake else avg_real

    details = {
        "fake_probability": round(avg_fake, 4),
        "real_probability": round(avg_real, 4),
        "frames_analyzed": len(raw_frames),
        "fake_frames": sum(1 for p in fake_probs if p >= settings.CONFIDENCE_THRESHOLD),
        "frame_results": frame_results,
        "model_version": settings.MODEL_VERSION,
        "media_type": "video",
        "inference_ms": inference_ms,
        "device": str(device),
    }

    return round(confidence, 4), verdict, details
