"""
Main Detection Engine
Orchestrates the complete detection pipeline for images and videos.
Uses hybrid approach for comprehensive deepfake detection.
"""

import logging
from typing import Dict, Any
from datetime import datetime, timezone

from .validators import MediaValidator, ValidationError
from .improved_hybrid_detector import improved_hybrid_detector

logger = logging.getLogger(__name__)


class DetectionEngine:
    """
    Main detection engine that handles the complete pipeline.
    
    Detection Strategy:
    Uses hybrid approach combining:
    1. CLIP for AI-generated images
    2. Face analysis for face-swap deepfakes
    3. Artifact detection for manipulated images
    """
    
    def __init__(self):
        self.validator = MediaValidator()
        self.detector = improved_hybrid_detector
    
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
            
            # Step 2: Run detection
            if media_type == "image":
                result = await self.detector.detect_image(file_bytes, filename)
            elif media_type == "video":
                result = await self.detector.detect_video(file_bytes, filename)
            else:
                raise ValueError(f"Unsupported media type: {media_type}")
            
            confidence = result["confidence"]
            verdict = result["verdict"]
            model_details = result["details"]
            
            # Step 3: Compile complete result
            detection_end = datetime.now(timezone.utc)
            total_processing_time = int((detection_end - detection_start).total_seconds() * 1000)
            
            final_result = {
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
                    "engine_version": "DeepVision-Improved-Hybrid-v2.0"
                }
            }
            
            logger.info(f"Detection completed: {verdict} ({confidence:.4f}) in {total_processing_time}ms")
            return final_result
            
        except ValidationError as e:
            logger.warning(f"Validation failed for {filename}: {e}")
            raise
        except RuntimeError as e:
            logger.error(f"Detection error for {filename}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during detection for {filename}: {e}")
            raise RuntimeError(f"Detection failed: {e}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about detection system status."""
        return {
            "primary_detector": {
                "type": "Hybrid Multi-Method Detection",
                "methods": [
                    "CLIP AI-Generated Detection (40%)",
                    "Face-Swap Deepfake Detection (40%)",
                    "Manipulation Artifact Detection (20%)"
                ],
                "models": [
                    "openai/clip-vit-base-patch32",
                    "MTCNN Face Detector"
                ],
                "available": True,
                "status": "active",
                "trained_on": "Multiple datasets"
            },
            "detection_mode": "Hybrid",
            "version": "1.0"
        }


# Global detection engine instance
detection_engine = DetectionEngine()