"""
app/schemas/user.py

Pydantic schemas for user profiles, statistics, preferences, analytics, feedback, and notifications.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import FeedbackStatus


# ── Profile ──────────────────────────────────────────────────

class UserPublic(BaseModel):
    """Safe public representation of a user profile."""
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "user"
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    """Payload for updating user profile info."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserStatistics(BaseModel):
    """Aggregated scan counts for a specific user."""
    total_detections: int = 0
    authentic_count: int = 0
    deepfake_count: int = 0
    last_detection_at: Optional[datetime] = None


# ── Settings ─────────────────────────────────────────────────

class UserSettings(BaseModel):
    """User preferences."""
    email_notifications: bool = True
    weekly_report: bool = False
    two_factor_enabled: bool = False
    theme: str = "dark"
    language: str = "en"
    timezone: str = "UTC"


class UserSettingsUpdate(BaseModel):
    """Payload for updating user preferences."""
    email_notifications: Optional[bool] = None
    weekly_report: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None


# ── Analytics ────────────────────────────────────────────────

class UserAnalyticsOverview(BaseModel):
    """Summary metrics for user dashboard."""
    total_detections: int = 0
    authentic_count: int = 0
    deepfake_count: int = 0
    success_rate: float = 0.0
    avg_processing_time: float = 0.0
    most_active_day: str = "Monday"
    last_7_days_detections: int = 0


class ChartData(BaseModel):
    """Time-series chart data points."""
    labels: List[str]
    detections: List[int]
    authentic: List[int]
    deepfake: List[int]


# ── Feedback ─────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    """User feedback submission payload."""
    detection_id: Optional[str] = None
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)


class FeedbackResponse(BaseModel):
    """Feedback item returned to clients."""
    id: str
    user_id: str
    detection_id: Optional[str] = None
    subject: str
    message: str
    status: FeedbackStatus
    created_at: datetime


class FeedbackUpdate(BaseModel):
    """Payload for updating feedback status."""
    status: FeedbackStatus


# ── Notifications ────────────────────────────────────────────

class NotificationItem(BaseModel):
    """Single user notification entry."""
    id: str
    title: str
    message: str
    type: str
    is_read: bool = False
    action_url: Optional[str] = None
    created_at: datetime


class NotificationResponse(BaseModel):
    """Notification feed response."""
    items: List[NotificationItem]
    unread_count: int
    total: int
