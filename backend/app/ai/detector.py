"""
Main Detection Engine
Orchestrates the complete detection pipeline for images and videos.
"""

import logging
from typing import Dict, Any, Tuple
from datetime import datetime, timezone

from .validators import MediaValidator, ValidationError
from .models import get_image_model, get_video_model, ModelLoadError, InferenceError

logger = logging.getLogger(__name__)


class DetectionEngine:
    """Main detection engine that handles the complete pipeline."""
    
    def __init__(self):
        self.validator = MediaValidator()
    
    async def detect_deepfake(self, file_bytes: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """
        Complete deepfake detection pipeline.
        
        Args:
            file_bytes: Raw file bytes
            filename: Original filename
            content_type: MIME type
            
        Returns:
            Detection result with confidence, verdict, and analysis details
        """
        detection_start = datetime.now(timezone.utc)
        
        try:
            # Step 1: Validate media file
            logger.info(f"Starting detection for {filename} ({content_type})")
            validation_result = self.validator.validate_media_file(file_bytes, filename, content_type)
            
            media_type = validation_result["media_type"]
            logger.info(f"File validated as {media_type}: {validation_result}")
            
            # Step 2: Run appropriate model
            if media_type == "image":
                confidence, verdict, model_details = await self._detect_image(file_bytes)
            elif media_type == "video":
                confidence, verdict, model_details = await self._detect_video(file_bytes)
            else:
                raise ValueError(f"Unsupported media type: {media_type}")
            
            # Step 3: Compile complete result
            detection_end = datetime.now(timezone.utc)
            total_processing_time = int((detection_end - detection_start).total_seconds() * 1000)
            
            result = {
                "verdict": verdict,
                "confidence": round(confidence, 4),
                "media_type": media_type,
                "file_validation": validation_result,
                "model_analysis": model_details,
                "processing_metrics": {
                    "total_processing_time_ms": total_processing_time,
                    "detection_started_at": detection_start.isoformat(),
                    "detection_completed_at": detection_end.isoformat()
                },
                "metadata": {
                    "filename": filename,
                    "content_type": content_type,
                    "file_size_bytes": len(file_bytes),
                    "engine_version": "DeepVision-Engine-v1.0"
                }
            }
            
            logger.info(f"Detection completed: {verdict} ({confidence:.4f}) in {total_processing_time}ms")
            return result
            
        except ValidationError as e:
            logger.warning(f"Validation failed for {filename}: {e}")
            raise
        except (ModelLoadError, InferenceError) as e:
            logger.error(f"AI model error for {filename}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during detection for {filename}: {e}")
            raise RuntimeError(f"Detection failed: {e}")
    
    async def _detect_image(self, image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
        """Run image deepfake detection."""
        try:
            image_model = get_image_model()
            confidence, verdict, details = image_model.predict(image_bytes)
            return confidence, verdict, details
        except Exception as e:
            logger.error(f"Image detection failed: {e}")
            raise InferenceError(f"Image detection failed: {e}")
    
    async def _detect_video(self, video_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
        """Run video deepfake detection."""
        try:
            video_model = get_video_model()
            confidence, verdict, details = video_model.predict(video_bytes)
            return confidence, verdict, details
        except Exception as e:
            logger.error(f"Video detection failed: {e}")
            raise InferenceError(f"Video detection failed: {e}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models."""
        image_model = get_image_model()
        video_model = get_video_model()
        
        return {
            "image_model": {
                "loaded": image_model.is_loaded,
                "version": image_model.IMAGE_MODEL_VERSION if hasattr(image_model, 'IMAGE_MODEL_VERSION') else "Unknown",
                "device": str(image_model.device)
            },
            "video_model": {
                "loaded": video_model.is_loaded,
                "version": video_model.VIDEO_MODEL_VERSION if hasattr(video_model, 'VIDEO_MODEL_VERSION') else "Unknown",
                "device": str(video_model.device)
            }
        }


# Global detection engine instance
detection_engine = DetectionEngine()