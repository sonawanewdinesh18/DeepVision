"""
app/api/v1/detection.py

Deepfake detection API routes — v1.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Query, status

from app.core.dependencies import get_current_user
from app.schemas.user import UserPublic
from app.schemas.common import SuccessResponse
from app.schemas.detection import (
    DetectionResult,
    DetectionHistoryResponse,
)
from app.services.detection_service import detection_service

router = APIRouter(prefix="/detection", tags=["Detection"])


@router.post(
    "/analyze",
    response_model=DetectionResult,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and analyze media for deepfakes",
)
async def analyze_media(
    file: UploadFile = File(..., description="Image or video file to analyze"),
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Analyze an uploaded image or video using the HybridViTCNN deep learning model.
    Returns verdict (REAL/FAKE), confidence score (0.0–1.0), and forensic metrics.
    """
    return await detection_service.analyze_and_save(file, current_user.id)


@router.get(
    "/history",
    response_model=DetectionHistoryResponse,
    summary="Fetch detection history for the current user",
)
async def get_history(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: UserPublic = Depends(get_current_user),
):
    """Return paginated list of past detections for the authenticated user."""
    return await detection_service.get_history(current_user.id, page=page, limit=limit)


@router.get(
    "/{detection_id}",
    response_model=DetectionResult,
    summary="Get single detection result by ID",
)
async def get_detection(
    detection_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Retrieve full details of a specific detection."""
    return await detection_service.get_detection(detection_id, current_user.id)


@router.delete(
    "/{detection_id}",
    response_model=SuccessResponse,
    summary="Delete a detection record and associated file",
)
async def delete_detection(
    detection_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Delete a detection entry and clean up storage assets."""
    await detection_service.delete_detection(detection_id, current_user.id)
    return SuccessResponse(message="Detection deleted successfully.")
