"""
app/api/v1/detection.py
Detection endpoints — v1.

Routes:
  POST /api/v1/detection/analyze   — upload media for analysis
  GET  /api/v1/detection/history   — get user's detection history
  GET  /api/v1/detection/{id}      — get a single result by ID
  DELETE /api/v1/detection/{id}    — delete a detection
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import Optional

from app.core.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.core.exceptions import CustomAPIException
from app.models.schemas import (
    DetectionResult, 
    UserPublic, 
    DetectionHistoryResponse,
    DetectionHistoryItem,
    SuccessResponse
)
from app.services.detection_service import detection_service

router = APIRouter(prefix="/detection", tags=["Detection"])

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "video/mp4", "video/webm", "video/quicktime",
}
MAX_FILE_SIZE_MB = 50


@router.post("/analyze", response_model=DetectionResult, status_code=status.HTTP_201_CREATED)
async def analyze_media(
    file: UploadFile = File(..., description="Image or video file to analyze"),
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Analyze an uploaded image or video for deepfake indicators.
    Returns a detection result with verdict (REAL/FAKE) and confidence score.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise CustomAPIException(
            message=f"Unsupported file type: {file.content_type}. "
                    f"Accepted: JPEG, PNG, WebP, MP4, WebM, MOV.",
            code="UNSUPPORTED_MEDIA_TYPE",
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        )

    try:
        result = await detection_service.analyze_and_save(file, current_user.id)
    except ValueError as e:
        raise CustomAPIException(
            message=str(e),
            code="INVALID_MEDIA",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    return result


@router.get("/history", response_model=DetectionHistoryResponse)
async def get_history(
    page: int = 1,
    limit: int = 20,
    current_user: UserPublic = Depends(get_current_user),
):
    """
    Return the detection history for the authenticated user.
    Paginated — defaults to page 1, 20 items per page.
    """
    supabase = get_supabase()
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get total count
    count_response = supabase.table("detections").select(
        "id", count="exact"
    ).eq("user_id", current_user.id).execute()
    total = count_response.count or 0
    
    # Get paginated results
    response = supabase.table("detections").select(
        "id, verdict, confidence, file_type, file_name, created_at"
    ).eq("user_id", current_user.id).order(
        "created_at", desc=True
    ).range(offset, offset + limit - 1).execute()
    
    items = [
        DetectionHistoryItem(
            id=item["id"],
            verdict=item["verdict"],
            confidence=item["confidence"],
            media_type=item["file_type"],
            file_name=item["file_name"],
            created_at=item["created_at"]
        )
        for item in response.data
    ]
    
    return DetectionHistoryResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/{detection_id}", response_model=DetectionResult)
async def get_detection(
    detection_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Return a single detection result by its ID."""
    supabase = get_supabase()
    
    response = supabase.table("detections").select("*").eq(
        "id", detection_id
    ).eq("user_id", current_user.id).execute()
    
    if not response.data:
        raise CustomAPIException(
            message=f"Detection {detection_id} not found.",
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    detection = response.data[0]
    
    return DetectionResult(
        id=detection["id"],
        verdict=detection["verdict"],
        confidence=detection["confidence"],
        media_type=detection["file_type"],
        file_name=detection["file_name"],
        file_url=detection["file_url"],
        model_version=detection["model_version"],
        processing_time_ms=detection.get("processing_time_ms"),
        created_at=detection["created_at"],
        details=detection.get("metadata", {})
    )


@router.delete("/{detection_id}", response_model=SuccessResponse)
async def delete_detection(
    detection_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Delete a detection and its associated file."""
    supabase = get_supabase()
    
    # Check if detection exists and belongs to user
    response = supabase.table("detections").select("file_url").eq(
        "id", detection_id
    ).eq("user_id", current_user.id).execute()
    
    if not response.data:
        raise CustomAPIException(
            message=f"Detection {detection_id} not found.",
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    # Delete from database (will cascade to analytics)
    supabase.table("detections").delete().eq("id", detection_id).execute()
    
    # TODO: Delete file from storage
    # file_url = response.data[0]["file_url"]
    # await storage_service.delete_file(file_url)
    
    return SuccessResponse(message="Detection deleted successfully")
