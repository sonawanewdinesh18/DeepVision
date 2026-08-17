"""
app/schemas/detection.py

Pydantic schemas for deepfake detection inputs, results, and history.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import MediaType, DetectionVerdict


class DetectionRequest(BaseModel):
    """Optional metadata accompanying an uploaded media file."""
    media_type: Optional[MediaType] = None


class DetectionResult(BaseModel):
    """Full deepfake detection response returned to clients."""
    id: str
    verdict: DetectionVerdict
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    media_type: MediaType
    file_name: str
    file_url: str = ""
    model_version: str
    processing_time_ms: Optional[int] = None
    created_at: datetime
    details: Optional[Dict[str, Any]] = None


class DetectionHistoryItem(BaseModel):
    """Simplified detection item for history tables and lists."""
    id: str
    verdict: DetectionVerdict
    confidence: float
    media_type: MediaType
    file_name: str
    file_url: Optional[str] = ""
    processing_time_ms: Optional[int] = None
    created_at: datetime


class DetectionHistoryResponse(BaseModel):
    """Paginated collection of user detections."""
    items: List[DetectionHistoryItem]
    total: int
    page: int
    limit: int


class DetectionAnalytics(BaseModel):
    """In-depth forensic analytics stored alongside a detection."""
    faces_detected: int = 0
    artifacts_found: List[Dict[str, Any]] = []
    frame_analysis: Dict[str, Any] = {}
