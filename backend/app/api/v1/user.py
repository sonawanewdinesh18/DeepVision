"""
app/api/v1/user.py

User profile, settings, analytics, feedback, and notification endpoints — v1.
"""

from typing import List
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user
from app.schemas.common import SuccessResponse
from app.schemas.user import (
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
)
from app.services.user_service import user_service

router = APIRouter(prefix="/user", tags=["User"])


# ── Profile ──────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic, summary="Get current user profile")
async def get_current_user_profile(
    current_user: UserPublic = Depends(get_current_user),
):
    """Retrieve profile details for the authenticated user."""
    return current_user


@router.post("/update-last-active", response_model=SuccessResponse, summary="Heartbeat / update active status")
async def update_last_active(
    current_user: UserPublic = Depends(get_current_user),
):
    """Update user's last activity timestamp."""
    await user_service.update_last_active(current_user.id)
    return SuccessResponse(message="Last active timestamp updated.")


@router.put("/me", response_model=UserPublic, summary="Update user profile")
async def update_user_profile(
    update_data: UserUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Update full name or avatar URL."""
    return await user_service.update_profile(current_user.id, current_user.email, update_data)


@router.get("/me/stats", response_model=UserStatistics, summary="Get personal scan statistics")
async def get_user_statistics(
    current_user: UserPublic = Depends(get_current_user),
):
    """Retrieve scan volume and deepfake detection metrics for the authenticated user."""
    return await user_service.get_statistics(current_user.id)


@router.delete("/me", response_model=SuccessResponse, summary="Delete user account")
async def delete_user_account(
    current_user: UserPublic = Depends(get_current_user),
):
    """Delete authenticated user's account and profile."""
    await user_service.delete_account(current_user.id)
    return SuccessResponse(message="Account deleted successfully.")


# ── Settings ─────────────────────────────────────────────────

@router.get("/settings", response_model=UserSettings, summary="Get user preferences")
async def get_user_settings(
    current_user: UserPublic = Depends(get_current_user),
):
    """Fetch user settings and notification preferences."""
    return await user_service.get_settings(current_user.id)


@router.put("/settings", response_model=SuccessResponse, summary="Update user preferences")
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Update theme, notifications, language, and other preferences."""
    updated = await user_service.update_settings(current_user.id, settings_update)
    return SuccessResponse(message="Settings updated successfully.", data=updated)


# ── Analytics ────────────────────────────────────────────────

@router.get("/analytics/overview", response_model=UserAnalyticsOverview, summary="Dashboard analytics overview")
async def get_analytics_overview(
    current_user: UserPublic = Depends(get_current_user),
):
    """Retrieve calculated metrics, success rates, and volume for user dashboard."""
    return await user_service.get_analytics_overview(current_user.id)


@router.get("/analytics/chart", response_model=ChartData, summary="Time-series chart data")
async def get_analytics_chart(
    days: int = Query(default=7, ge=1, le=90, description="Number of past days"),
    current_user: UserPublic = Depends(get_current_user),
):
    """Retrieve daily time-series counts of authentic vs deepfake scans."""
    return await user_service.get_analytics_chart(current_user.id, days=days)


# ── Feedback ─────────────────────────────────────────────────

@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit feedback")
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    """Submit feedback on a detection result or platform experience."""
    return await user_service.submit_feedback(current_user.id, feedback)


@router.get("/feedback", response_model=List[FeedbackResponse], summary="List user's submitted feedback")
async def get_user_feedback(
    current_user: UserPublic = Depends(get_current_user),
):
    """Retrieve history of feedback tickets submitted by the authenticated user."""
    return await user_service.get_feedback_list(current_user.id)


@router.get("/feedback/{feedback_id}", response_model=FeedbackResponse, summary="Get feedback ticket details")
async def get_feedback_details(
    feedback_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Retrieve specific feedback item details."""
    return await user_service.get_feedback_details(feedback_id, current_user.id)


# ── Notifications ────────────────────────────────────────────

@router.get("/notifications", response_model=NotificationResponse, summary="Get user notification feed")
async def get_notifications(
    unread_only: bool = Query(default=False, description="Filter for unread notifications only"),
    current_user: UserPublic = Depends(get_current_user),
):
    """Fetch notifications for the authenticated user."""
    return await user_service.get_notifications(current_user.id, unread_only=unread_only)


@router.put("/notifications/{notification_id}/read", response_model=SuccessResponse, summary="Mark notification as read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Mark a notification item as read."""
    await user_service.mark_notification_read(notification_id, current_user.id)
    return SuccessResponse(message="Notification marked as read.")


@router.delete("/notifications/{notification_id}", response_model=SuccessResponse, summary="Delete notification")
async def delete_notification(
    notification_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    """Remove a notification item."""
    await user_service.delete_notification(notification_id, current_user.id)
    return SuccessResponse(message="Notification deleted successfully.")
