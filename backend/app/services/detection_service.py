"""
app/services/detection_service.py
Business logic for deepfake detection.

This module acts as the bridge between the API layer and the AI detection engine.
Integrates with the professional AI module for real deepfake detection.
"""

import uuid
import logging
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException

from app.core.supabase_client import get_supabase
from app.models.schemas import DetectionResult, DetectionVerdict, MediaType
from app.ai.detector import detection_engine
from app.ai.validators import ValidationError
from app.ai.models import ModelLoadError, InferenceError

logger = logging.getLogger(__name__)


class DetectionService:
    """Handles file pre-processing, AI model inference, and result packaging."""

    def __init__(self):
        self.detection_engine = detection_engine

    def _resolve_media_type(self, content_type: str) -> MediaType:
        """Convert content type to MediaType enum."""
        if content_type.startswith("image/"):
            return MediaType.image
        elif content_type.startswith("video/"):
            return MediaType.video
        else:
            raise ValueError(f"Unsupported media type: {content_type}")

    async def analyze(self, file: UploadFile) -> DetectionResult:
        """
        Analyze an uploaded media file for deepfake indicators.

        Steps:
          1. Validate media type and file
          2. Read file bytes
          3. Run AI detection engine
          4. Package result
        """
        try:
            # Validate content type
            media_type = self._resolve_media_type(file.content_type or "")
            
            # Read file bytes
            file_bytes = await file.read()
            
            # Run AI detection
            detection_result = await self.detection_engine.detect_deepfake(
                file_bytes=file_bytes,
                filename=file.filename or "unknown",
                content_type=file.content_type or ""
            )
            
            # Convert AI result to API schema
            verdict = DetectionVerdict.fake if detection_result["verdict"] == "FAKE" else DetectionVerdict.real
            
            return DetectionResult(
                id=str(uuid.uuid4()),
                verdict=verdict,
                confidence=detection_result["confidence"],
                media_type=media_type,
                file_name=file.filename or "unknown",
                file_url="",
                model_version=detection_result["metadata"]["engine_version"],
                processing_time_ms=detection_result["processing_metrics"]["total_processing_time_ms"],
                created_at=datetime.now(timezone.utc),
                details={
                    "file_name": file.filename,
                    "file_size_bytes": detection_result["metadata"]["file_size_bytes"],
                    "ai_analysis": detection_result["model_analysis"],
                    "validation_info": detection_result["file_validation"]
                },
            )
            
        except ValidationError as e:
            logger.warning(f"File validation failed: {e}")
            raise HTTPException(status_code=400, detail=f"File validation failed: {str(e)}")
        except (ModelLoadError, InferenceError) as e:
            logger.error(f"AI model error: {e}")
            raise HTTPException(status_code=500, detail="AI detection service temporarily unavailable")
        except Exception as e:
            logger.error(f"Unexpected error during analysis: {e}")
            raise HTTPException(status_code=500, detail="Detection analysis failed")

    async def analyze_and_save(self, file: UploadFile, user_id: str) -> DetectionResult:
        """
        Analyze media and save to database with full AI detection.
        """
        try:
            # Validate content type
            media_type = self._resolve_media_type(file.content_type or "")
            
            # Read file bytes
            file_bytes = await file.read()
            file_size = len(file_bytes)
            
            # Run AI detection first
            detection_result = await self.detection_engine.detect_deepfake(
                file_bytes=file_bytes,
                filename=file.filename or "unknown",
                content_type=file.content_type or ""
            )
            
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
            
            # Convert AI result
            verdict = DetectionVerdict.fake if detection_result["verdict"] == "FAKE" else DetectionVerdict.real
            confidence = detection_result["confidence"]
            processing_time = detection_result["processing_metrics"]["total_processing_time_ms"]
            
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
                "model_version": detection_result["metadata"]["engine_version"],
                "processing_time_ms": processing_time,
                "metadata": {
                    "ai_analysis": detection_result["model_analysis"],
                    "validation_info": detection_result["file_validation"],
                    "processing_metrics": detection_result["processing_metrics"]
                }
            }
            
            supabase.table("detections").insert(detection_data).execute()
            
            # Save detailed analytics
            analytics_data = {
                "detection_id": detection_id,
                "faces_detected": detection_result["model_analysis"].get("faces_detected", 0),
                "artifacts_found": detection_result["model_analysis"].get("artifacts_found", []),
                "frame_analysis": detection_result["model_analysis"]
            }
            supabase.table("detection_analytics").insert(analytics_data).execute()
            
            return DetectionResult(
                id=detection_id,
                verdict=verdict,
                confidence=confidence,
                media_type=media_type,
                file_name=file.filename or "unknown",
                file_url=file_url,
                model_version=detection_result["metadata"]["engine_version"],
                processing_time_ms=processing_time,
                created_at=datetime.now(timezone.utc),
                details={
                    "file_name": file.filename,
                    "file_size_bytes": file_size,
                    "ai_analysis": detection_result["model_analysis"],
                    "validation_info": detection_result["file_validation"]
                },
            )
            
        except ValidationError as e:
            logger.warning(f"File validation failed for user {user_id}: {e}")
            raise HTTPException(status_code=400, detail=f"File validation failed: {str(e)}")
        except (ModelLoadError, InferenceError) as e:
            logger.error(f"AI model error for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="AI detection service temporarily unavailable")
        except Exception as e:
            logger.error(f"Unexpected error during analysis for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Detection analysis failed")

    def get_model_status(self) -> dict:
        """Get current AI model status for admin monitoring."""
        try:
            return self.detection_engine.get_model_info()
        except Exception as e:
            logger.error(f"Failed to get model status: {e}")
            return {
                "error": str(e),
                "image_model": {"loaded": False},
                "video_model": {"loaded": False}
            }


# Module-level singleton
detection_service = DetectionService()
