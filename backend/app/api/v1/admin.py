"""
app/api/v1/admin.py

Administrative API routes for dashboard telemetry, user management, feedback triage, and AI health monitoring.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_admin_user
from app.schemas.common import SuccessResponse
from app.schemas.user import UserPublic
from app.schemas.admin import (
    AdminStatsResponse,
    AdminActivityResponse,
    AdminUsersResponse,
    AdminFeedbackResponse,
    AdminChartResponse,
)
from app.services.admin_service import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Dashboard & Analytics ────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse, summary="Get global system statistics")
async def get_admin_stats(
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Retrieve platform-wide statistics: total scans, deepfakes detected, active users, and system accuracy."""
    return await admin_service.get_stats()


@router.get("/activity", response_model=AdminActivityResponse, summary="Get recent detection activity")
async def get_recent_activity(
    limit: int = Query(default=10, ge=1, le=100, description="Max records to return"),
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Fetch global detection activity feed across all users."""
    return await admin_service.get_recent_activity(limit=limit)


@router.get("/chart-data", response_model=AdminChartResponse, summary="Get platform time-series scan data")
async def get_chart_data(
    days: int = Query(default=7, ge=1, le=90, description="Number of days"),
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Retrieve daily authentic vs deepfake scans across the entire platform."""
    return await admin_service.get_chart_data(days=days)


# ── User Management ──────────────────────────────────────────

@router.get("/users", response_model=AdminUsersResponse, summary="Get all registered users")
async def get_all_users(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Page size"),
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Retrieve paginated list of user accounts with scan statistics."""
    return await admin_service.get_users(page=page, limit=limit)


@router.post("/users", status_code=status.HTTP_201_CREATED, summary="Create a new user account")
async def create_user(
    email: str = Query(..., description="User email address"),
    password: str = Query(..., min_length=6, description="Initial password"),
    full_name: Optional[str] = Query(default=None, description="Full name"),
    role: str = Query(default="user", description="Account role ('user' or 'admin')"),
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Create a new user account with specified credentials and role."""
    return await admin_service.create_user(email=email, password=password, full_name=full_name, role=role)


@router.put("/users/{user_id}", summary="Update user account")
async def update_user(
    user_id: str,
    full_name: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Update profile attributes, role, or active status for a specific user."""
    return await admin_service.update_user(user_id=user_id, full_name=full_name, role=role, is_active=is_active)


@router.put("/users/{user_id}/toggle-status", summary="Toggle user active status")
async def toggle_user_status(
    user_id: str,
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Toggle user active / suspended status."""
    return await admin_service.toggle_user_status(user_id)


@router.delete("/users/{user_id}", response_model=SuccessResponse, summary="Delete user account")
async def delete_user(
    user_id: str,
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Delete a user account and associated detection data."""
    await admin_service.delete_user(user_id)
    return SuccessResponse(message="User deleted successfully.")


# ── AI Model Health ──────────────────────────────────────────

@router.get("/ai-status", summary="Get AI inference engine diagnostic status")
async def get_ai_model_status(
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Inspect the runtime status, loaded weights, and device allocation for AI models."""
    return admin_service.get_ai_status()


# ── Feedback Management ──────────────────────────────────────

@router.get("/feedback", response_model=AdminFeedbackResponse, summary="List user feedback items")
async def get_feedback(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Retrieve paginated feedback tickets with optional status filtering."""
    return await admin_service.get_feedback(page=page, limit=limit, status_filter=status_filter)


@router.put("/feedback/{feedback_id}", summary="Update feedback status")
async def update_feedback_status(
    feedback_id: str,
    status: str = Query(..., description="New status (pending, reviewed, resolved)"),
    admin_response: Optional[str] = Query(default=None, description="Optional admin message"),
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Update review status and append admin resolution notes."""
    return await admin_service.update_feedback(feedback_id=feedback_id, status=status, admin_response=admin_response)


@router.delete("/feedback/{feedback_id}", response_model=SuccessResponse, summary="Delete feedback ticket")
async def delete_feedback(
    feedback_id: str,
    admin: UserPublic = Depends(get_current_admin_user),
):
    """Delete a feedback ticket."""
    await admin_service.delete_feedback(feedback_id)
    return SuccessResponse(message="Feedback deleted successfully.")
