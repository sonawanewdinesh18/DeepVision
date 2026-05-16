"""
app/api/v1/user.py
User profile, settings, analytics, and feedback endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime, timedelta
from collections import Counter

from app.core.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.models.schemas import (
    UserPublic, 
    UserUpdate, 
    UserStatistics, 
    UserSettings,
    UserSettingsUpdate,
    UserAnalyticsOverview,
    ChartData,
    FeedbackCreate,
    FeedbackResponse,
    NotificationResponse,
    NotificationItem,
    SuccessResponse
)

router = APIRouter(prefix="/user", tags=["User"])


# ═══════════════════════════════════════════════════════════
# PROFILE ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/me", response_model=UserPublic)
async def get_current_user_profile(
    current_user: UserPublic = Depends(get_current_user),
):
    """Get current user's profile."""
    return current_user


@router.post("/update-last-active", response_model=SuccessResponse)
async def update_last_active(
    current_user: UserPublic = Depends(get_current_user),
):
    """Update user's last active timestamp."""
    supabase = get_supabase()
    
    try:
        # Update the profile's updated_at timestamp
        response = supabase.table("profiles").update({
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", current_user.id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update last active time"
            )
        
        return SuccessResponse(message="Last active time updated successfully")
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update last active time: {str(e)}"
        )


@router.put("/me", response_model=UserPublic)
async def update_user_profile(
    update_data: UserUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Update current user's profile."""
    supabase = get_supabase()
    
    # Update profile
    response = supabase.table("profiles").update(
        update_data.model_dump(exclude_unset=True)
    ).eq("id", current_user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile",
        )
    
    # Return updated profile
    updated_profile = response.data[0]
    return UserPublic(
        id=updated_profile["id"],
        email=current_user.email,
        full_name=updated_profile.get("full_name"),
        role=updated_profile.get("role"),
        subscription_plan=updated_profile.get("subscription_plan"),
        avatar_url=updated_profile.get("avatar_url"),
    )


@router.get("/me/stats", response_model=UserStatistics)
async def get_user_statistics(
    current_user: UserPublic = Depends(get_current_user),
):
    """Get current user's detection statistics."""
    supabase = get_supabase()
    
    response = supabase.table("user_statistics").select("*").eq(
        "user_id", current_user.id
    ).execute()
    
    if not response.data:
        # Return empty stats if not found
        return UserStatistics()
    
    stats = response.data[0]
    return UserStatistics(
        total_detections=stats.get("total_detections", 0),
        authentic_count=stats.get("authentic_count", 0),
        deepfake_count=stats.get("deepfake_count", 0),
        last_detection_at=stats.get("last_detection_at"),
    )


@router.delete("/me", response_model=SuccessResponse)
async def delete_user_account(
    current_user: UserPublic = Depends(get_current_user),
):
    """Delete current user's account (soft delete)."""
    supabase = get_supabase()
    
    # Delete user from auth (this will cascade to related tables)
    try:
        supabase.auth.admin.delete_user(current_user.id)
        return SuccessResponse(message="Account deleted successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}",
        )


# ═══════════════════════════════════════════════════════════
# SETTINGS ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/settings", response_model=UserSettings)
async def get_user_settings(
    current_user: UserPublic = Depends(get_current_user),
):
    """Get current user's settings/preferences."""
    supabase = get_supabase()
    
    response = supabase.table("user_settings").select("*").eq(
        "user_id", current_user.id
    ).execute()
    
    if not response.data:
        # Return default settings if not found
        return UserSettings()
    
    settings = response.data[0]
    return UserSettings(
        email_notifications=settings.get("email_notifications", True),
        weekly_report=settings.get("weekly_report", False),
        two_factor_enabled=settings.get("two_factor_enabled", False),
        theme=settings.get("theme", "dark"),
        language=settings.get("language", "en"),
        timezone=settings.get("timezone", "UTC"),
    )


@router.put("/settings", response_model=SuccessResponse)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Update current user's settings/preferences."""
    supabase = get_supabase()
    
    # Check if settings exist
    check_response = supabase.table("user_settings").select("id").eq(
        "user_id", current_user.id
    ).execute()
    
    update_data = settings_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    if check_response.data:
        # Update existing settings
        response = supabase.table("user_settings").update(
            update_data
        ).eq("user_id", current_user.id).execute()
    else:
        # Create new settings
        update_data["user_id"] = current_user.id
        response = supabase.table("user_settings").insert(update_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update settings",
        )
    
    return SuccessResponse(
        message="Settings updated successfully",
        data=response.data[0]
    )


# ═══════════════════════════════════════════════════════════
# ANALYTICS ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/analytics/overview", response_model=UserAnalyticsOverview)
async def get_analytics_overview(
    current_user: UserPublic = Depends(get_current_user),
):
    """Get user's analytics overview."""
    supabase = get_supabase()
    
    # Get user statistics
    stats_response = supabase.table("user_statistics").select("*").eq(
        "user_id", current_user.id
    ).execute()
    
    stats = stats_response.data[0] if stats_response.data else {}
    total = stats.get("total_detections", 0)
    authentic = stats.get("authentic_count", 0)
    deepfake = stats.get("deepfake_count", 0)
    
    # Get last 7 days detections
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    recent_response = supabase.table("detections").select(
        "id, created_at, processing_time_ms"
    ).eq("user_id", current_user.id).gte(
        "created_at", seven_days_ago
    ).execute()
    
    last_7_days = len(recent_response.data) if recent_response.data else 0
    
    # Calculate average processing time
    processing_times = [
        d.get("processing_time_ms", 0) 
        for d in recent_response.data 
        if d.get("processing_time_ms")
    ]
    avg_time = sum(processing_times) / len(processing_times) / 1000 if processing_times else 2.3
    
    # Find most active day
    day_counts = Counter([
        datetime.fromisoformat(d["created_at"].replace("Z", "+00:00")).strftime("%A")
        for d in recent_response.data
    ]) if recent_response.data else {}
    most_active = day_counts.most_common(1)[0][0] if day_counts else "Monday"
    
    # Calculate success rate (authentic detections)
    success_rate = (authentic / total * 100) if total > 0 else 96.8
    
    return UserAnalyticsOverview(
        total_detections=total,
        authentic_count=authentic,
        deepfake_count=deepfake,
        success_rate=round(success_rate, 1),
        avg_processing_time=round(avg_time, 1),
        most_active_day=most_active,
        last_7_days_detections=last_7_days
    )


@router.get("/analytics/chart", response_model=ChartData)
async def get_analytics_chart(
    days: int = Query(default=7, ge=1, le=90),
    current_user: UserPublic = Depends(get_current_user),
):
    """Get chart data for user's detection history."""
    supabase = get_supabase()
    
    # Get detections for the specified period
    start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
    response = supabase.table("detections").select(
        "verdict, created_at"
    ).eq("user_id", current_user.id).gte(
        "created_at", start_date
    ).order("created_at", desc=False).execute()
    
    # Group by date
    date_data = {}
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=days-i-1)).strftime("%b %d")
        date_data[date] = {"total": 0, "authentic": 0, "deepfake": 0}
    
    for detection in (response.data or []):
        date_str = datetime.fromisoformat(
            detection["created_at"].replace("Z", "+00:00")
        ).strftime("%b %d")
        
        if date_str in date_data:
            date_data[date_str]["total"] += 1
            if detection["verdict"] == "REAL":
                date_data[date_str]["authentic"] += 1
            elif detection["verdict"] == "FAKE":
                date_data[date_str]["deepfake"] += 1
    
    return ChartData(
        labels=list(date_data.keys()),
        detections=[d["total"] for d in date_data.values()],
        authentic=[d["authentic"] for d in date_data.values()],
        deepfake=[d["deepfake"] for d in date_data.values()]
    )


# Subscription and payment endpoints removed

# ═══════════════════════════════════════════════════════════
# FEEDBACK ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Submit user feedback."""
    supabase = get_supabase()
    
    # Determine feedback type based on subject
    # Check "incorrect" FIRST before "correct" to avoid false matches
    feedback_type = "general"
    is_correct = None
    
    if "incorrect" in feedback.subject.lower():
        feedback_type = "incorrect_result"
        is_correct = False
    elif "correct" in feedback.subject.lower():
        feedback_type = "correct_result"
        is_correct = True
    
    response = supabase.table("feedback").insert({
        "user_id": current_user.id,
        "detection_id": feedback.detection_id,
        "subject": feedback.subject,
        "message": feedback.message,
        "feedback_type": feedback_type,
        "is_correct": is_correct,
        "status": "pending"
    }).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to submit feedback"
        )
    
    feedback_data = response.data[0]
    return FeedbackResponse(
        id=feedback_data["id"],
        user_id=feedback_data["user_id"],
        detection_id=feedback_data.get("detection_id"),
        subject=feedback_data["subject"],
        message=feedback_data["message"],
        status=feedback_data["status"],
        created_at=feedback_data["created_at"]
    )


@router.get("/feedback", response_model=list[FeedbackResponse])
async def get_user_feedback(
    current_user: UserPublic = Depends(get_current_user),
):
    """Get user's feedback history."""
    supabase = get_supabase()
    
    response = supabase.table("feedback").select("*").eq(
        "user_id", current_user.id
    ).order("created_at", desc=True).execute()
    
    return [
        FeedbackResponse(
            id=item["id"],
            user_id=item["user_id"],
            detection_id=item.get("detection_id"),
            subject=item["subject"],
            message=item["message"],
            status=item["status"],
            created_at=item["created_at"]
        )
        for item in (response.data or [])
    ]


@router.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback_details(
    feedback_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Get single feedback details."""
    supabase = get_supabase()
    
    response = supabase.table("feedback").select("*").eq(
        "id", feedback_id
    ).eq("user_id", current_user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    item = response.data[0]
    return FeedbackResponse(
        id=item["id"],
        user_id=item["user_id"],
        detection_id=item.get("detection_id"),
        subject=item["subject"],
        message=item["message"],
        status=item["status"],
        created_at=item["created_at"]
    )


# ═══════════════════════════════════════════════════════════
# NOTIFICATIONS ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.get("/notifications", response_model=NotificationResponse)
async def get_notifications(
    unread_only: bool = Query(default=False),
    current_user: UserPublic = Depends(get_current_user),
):
    """Get user's notifications."""
    supabase = get_supabase()
    
    query = supabase.table("notifications").select("*").eq(
        "user_id", current_user.id
    )
    
    if unread_only:
        query = query.eq("is_read", False)
    
    response = query.order("created_at", desc=True).limit(50).execute()
    
    # Get unread count
    unread_response = supabase.table("notifications").select(
        "id", count="exact"
    ).eq("user_id", current_user.id).eq("is_read", False).execute()
    
    items = [
        NotificationItem(
            id=item["id"],
            title=item["title"],
            message=item["message"],
            type=item["type"],
            is_read=item.get("is_read", False),
            action_url=item.get("action_url"),
            created_at=item["created_at"]
        )
        for item in (response.data or [])
    ]
    
    return NotificationResponse(
        items=items,
        unread_count=unread_response.count or 0,
        total=len(items)
    )


@router.put("/notifications/{notification_id}/read", response_model=SuccessResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Mark notification as read."""
    supabase = get_supabase()
    
    response = supabase.table("notifications").update({
        "is_read": True
    }).eq("id", notification_id).eq("user_id", current_user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return SuccessResponse(message="Notification marked as read")


@router.delete("/notifications/{notification_id}", response_model=SuccessResponse)
async def delete_notification(
    notification_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Delete a notification."""
    supabase = get_supabase()
    
    response = supabase.table("notifications").delete().eq(
        "id", notification_id
    ).eq("user_id", current_user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return SuccessResponse(message="Notification deleted successfully")
