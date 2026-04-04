"""
app/services/detection_service.py
Business logic for deepfake detection.

This module acts as the bridge between the API layer and the AI model.
Currently returns mock data — replace model.predict() call with the real inference.
"""

import uuid
from datetime import datetime, timezone
from fastapi import UploadFile

from app.core.supabase_client import get_supabase
from app.models.schemas import DetectionResult, DetectionVerdict, MediaType


class DetectionService:
    """Handles file pre-processing, model inference, and result packaging."""

    SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    SUPPORTED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
    MODEL_VERSION = "EfficientNet-B4 v1.0"

    def _resolve_media_type(self, content_type: str) -> MediaType:
        if content_type in self.SUPPORTED_IMAGE_TYPES:
            return MediaType.image
        if content_type in self.SUPPORTED_VIDEO_TYPES:
            return MediaType.video
        raise ValueError(f"Unsupported media type: {content_type}")

    async def analyze(self, file: UploadFile) -> DetectionResult:
        """
        Analyze an uploaded media file for deepfake indicators.

        Steps:
          1. Validate media type
          2. Read file bytes
          3. Run inference (stub — replace with real model call)
          4. Package result
        """
        media_type = self._resolve_media_type(file.content_type or "")
        file_bytes = await file.read()

        # ── TODO: Replace with real inference ──────────────────
        #   from app.ml.model import load_model
        #   model = load_model(settings.MODEL_PATH)
        #   confidence, verdict = model.predict(file_bytes)
        # ───────────────────────────────────────────────────────

        # Stub: always returns REAL with 98% confidence
        confidence = 0.982
        verdict = DetectionVerdict.real

        return DetectionResult(
            id=str(uuid.uuid4()),
            verdict=verdict,
            confidence=confidence,
            media_type=media_type,
            file_name=file.filename or "unknown",
            file_url="",
            model_version=self.MODEL_VERSION,
            created_at=datetime.now(timezone.utc),
            details={
                "file_name": file.filename,
                "file_size_bytes": len(file_bytes),
                "faces_detected": 1,
            },
        )

    async def analyze_and_save(self, file: UploadFile, user_id: str) -> DetectionResult:
        """
        Analyze media and save to database.
        """
        media_type = self._resolve_media_type(file.content_type or "")
        file_bytes = await file.read()
        file_size = len(file_bytes)
        
        # Upload file to Supabase Storage
        supabase = get_supabase()
        file_path = f"{user_id}/{uuid.uuid4()}_{file.filename}"
        
        storage_response = supabase.storage.from_("detection-media").upload(
            file_path,
            file_bytes,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        file_url = supabase.storage.from_("detection-media").get_public_url(file_path)
        
        # ── TODO: Replace with real inference ──────────────────
        # Stub: Mock detection results
        import random
        confidence = round(random.uniform(0.85, 0.99), 3)
        verdict = DetectionVerdict.real if confidence > 0.90 else DetectionVerdict.fake
        # ───────────────────────────────────────────────────────
        
        detection_id = str(uuid.uuid4())
        
        # Save to database
        detection_data = {
            "id": detection_id,
            "user_id": user_id,
            "file_name": file.filename or "unknown",
            "file_url": file_url,
            "file_type": media_type.value,
            "file_size": file_size,
            "verdict": verdict.value,
            "confidence": confidence,
            "model_version": self.MODEL_VERSION,
            "processing_time_ms": 1250,
            "metadata": {
                "faces_detected": 1,
                "file_size_bytes": file_size,
            }
        }
        
        supabase.table("detections").insert(detection_data).execute()
        
        # Save analytics
        analytics_data = {
            "detection_id": detection_id,
            "faces_detected": 1,
            "artifacts_found": [],
            "frame_analysis": {}
        }
        supabase.table("detection_analytics").insert(analytics_data).execute()
        
        return DetectionResult(
            id=detection_id,
            verdict=verdict,
            confidence=confidence,
            media_type=media_type,
            file_name=file.filename or "unknown",
            file_url=file_url,
            model_version=self.MODEL_VERSION,
            processing_time_ms=1250,
            created_at=datetime.now(timezone.utc),
            details={
                "file_name": file.filename,
                "file_size_bytes": file_size,
                "faces_detected": 1,
            },
        )


# Module-level singleton
detection_service = DetectionService()
