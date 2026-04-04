"""
app/models/schemas.py
Pydantic schemas (request/response models) for the DeepVision API.
"""

from enum import Enum
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, EmailStr


# ── Enums ────────────────────────────────────────────────────

class MediaType(str, Enum):
    image = "image"
    video = "video"

class DetectionVerdict(str, Enum):
    real = "REAL"
    fake = "FAKE"
    uncertain = "UNCERTAIN"

class UserRole(str, Enum):
    user = "user"
    admin = "admin"

class SubscriptionPlan(str, Enum):
    free = "free"
    pro = "pro"
    enterprise = "enterprise"

class SubscriptionStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    cancelled = "cancelled"

class FeedbackStatus(str, Enum):
    pending = "pending"
    reviewed = "reviewed"
    resolved = "resolved"


# ── User ─────────────────────────────────────────────────────

class UserPublic(BaseModel):
    """Safe user representation (no sensitive fields)."""
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "user"
    subscription_plan: str = "free"
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None


class UserUpdate(BaseModel):
    """User profile update request."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserStatistics(BaseModel):
    """User statistics."""
    total_detections: int = 0
    authentic_count: int = 0
    deepfake_count: int = 0
    last_detection_at: Optional[datetime] = None


# ── Detection ────────────────────────────────────────────────

class DetectionRequest(BaseModel):
    """Metadata sent alongside the uploaded file."""
    media_type: Optional[MediaType] = None


class DetectionResult(BaseModel):
    """Full detection response returned to the client."""
    id: str
    verdict: DetectionVerdict
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0–1")
    media_type: MediaType
    file_name: str
    file_url: str
    model_version: str
    processing_time_ms: Optional[int] = None
    created_at: datetime
    details: Optional[dict[str, Any]] = None


class DetectionHistoryItem(BaseModel):
    """Simplified detection for history list."""
    id: str
    verdict: DetectionVerdict
    confidence: float
    media_type: MediaType
    file_name: str
    created_at: datetime


class DetectionHistoryResponse(BaseModel):
    """Paginated detection history."""
    items: list[DetectionHistoryItem]
    total: int
    page: int
    limit: int


class DetectionAnalytics(BaseModel):
    """Detailed analytics for a detection."""
    faces_detected: int = 0
    artifacts_found: list[dict] = []
    frame_analysis: dict = {}


# ── Feedback ─────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    """Create feedback request."""
    detection_id: Optional[str] = None
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)


class FeedbackResponse(BaseModel):
    """Feedback response."""
    id: str
    user_id: str
    detection_id: Optional[str] = None
    subject: str
    message: str
    status: FeedbackStatus
    created_at: datetime


class FeedbackUpdate(BaseModel):
    """Update feedback status (admin only)."""
    status: FeedbackStatus


# ── Admin ────────────────────────────────────────────────────

class AdminUserResponse(BaseModel):
    """Admin view of user with additional details."""
    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    subscription_plan: SubscriptionPlan
    subscription_status: SubscriptionStatus
    created_at: datetime
    total_detections: int = 0


class AdminUserUpdate(BaseModel):
    """Admin user update request."""
    role: Optional[UserRole] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    subscription_status: Optional[SubscriptionStatus] = None


class SystemAnalytics(BaseModel):
    """System-wide analytics."""
    total_users: int
    active_users: int
    total_detections: int
    detections_today: int
    avg_confidence: float
    authentic_percentage: float
    deepfake_percentage: float


class DailyAnalytics(BaseModel):
    """Daily analytics data."""
    date: str
    total_detections: int
    active_users: int
    avg_confidence: float


# ── Generic API Responses ─────────────────────────────────────

class APIError(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: APIError


class SuccessResponse(BaseModel):
    message: str
    data: Optional[Any] = None


class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


# ── User Settings ────────────────────────────────────────────

class UserSettings(BaseModel):
    """User settings/preferences."""
    email_notifications: bool = True
    weekly_report: bool = False
    two_factor_enabled: bool = False
    theme: str = "dark"
    language: str = "en"
    timezone: str = "UTC"


class UserSettingsUpdate(BaseModel):
    """Update user settings."""
    email_notifications: Optional[bool] = None
    weekly_report: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None


# ── User Analytics ───────────────────────────────────────────

class UserAnalyticsOverview(BaseModel):
    """User analytics overview."""
    total_detections: int
    authentic_count: int
    deepfake_count: int
    success_rate: float
    avg_processing_time: float
    most_active_day: str
    last_7_days_detections: int


class ChartData(BaseModel):
    """Chart data for analytics."""
    labels: list[str]
    detections: list[int]
    authentic: list[int]
    deepfake: list[int]


# ── Subscription ─────────────────────────────────────────────

class SubscriptionPlanResponse(BaseModel):
    """Subscription plan details."""
    id: str
    name: str
    price: float
    currency: str = "INR"
    interval: str
    features: list[str]
    max_detections: Optional[int] = None
    is_active: bool = True
    is_current: bool = False


class UserSubscriptionResponse(BaseModel):
    """User's current subscription."""
    plan: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    detections_used: int = 0
    detections_limit: Optional[int] = None


class SubscriptionUpgradeRequest(BaseModel):
    """Subscription upgrade request."""
    plan_id: str
    payment_method: str = "card"


# ── Payment ──────────────────────────────────────────────────

class PaymentHistoryItem(BaseModel):
    """Payment history item."""
    id: str
    amount: float
    currency: str = "INR"
    status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    subscription_plan: Optional[str] = None
    created_at: datetime


class PaymentHistoryResponse(BaseModel):
    """Paginated payment history."""
    items: list[PaymentHistoryItem]
    total: int
    page: int
    limit: int


class PaymentDetails(BaseModel):
    """Detailed payment information."""
    id: str
    amount: float
    currency: str = "INR"
    status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    subscription_plan: Optional[str] = None
    invoice_url: Optional[str] = None
    created_at: datetime


# ── Notifications ────────────────────────────────────────────

class NotificationItem(BaseModel):
    """Notification item."""
    id: str
    title: str
    message: str
    type: str
    is_read: bool = False
    action_url: Optional[str] = None
    created_at: datetime


class NotificationResponse(BaseModel):
    """Notifications list response."""
    items: list[NotificationItem]
    unread_count: int
    total: int
