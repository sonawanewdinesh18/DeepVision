"""
app/schemas/admin.py

Pydantic schemas for administrator dashboards, system statistics, and management endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.schemas.common import UserRole


class AdminStatsResponse(BaseModel):
    """Global system-wide performance and volume metrics."""
    total_scans: int
    deepfakes_detected: int
    active_users: int
    system_accuracy: float
    scans_change: float = 0.0
    deepfakes_change: float = 0.0
    users_change: float = 0.0
    accuracy_change: float = 0.0
    total_users: int = 0
    total_users_change: float = 0.0
    avg_response_time: int = 0
    response_time_change: float = 0.0


class AdminActivityItem(BaseModel):
    """Recent system detection activity record."""
    id: str
    file_name: str
    verdict: str
    confidence: float
    created_at: str
    user_name: str
    user_email: str


class AdminActivityResponse(BaseModel):
    """List of recent system activities."""
    activities: List[AdminActivityItem]


class AdminUserItem(BaseModel):
    """User account record with scan metrics."""
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str
    last_active: Optional[str] = None
    detection_count: int = 0


class AdminUsersResponse(BaseModel):
    """Paginated user management list."""
    users: List[AdminUserItem]
    total: int
    page: int
    limit: int
    pages: int


class AdminModelItem(BaseModel):
    """AI Model registry record."""
    id: str
    name: str
    version: str
    accuracy: float = 0.0
    status: str = "active"
    created_at: str
    updated_at: Optional[str] = None
    detection_count: int = 0


class AdminModelsResponse(BaseModel):
    """List of registered models."""
    models: List[AdminModelItem]


class AdminFeedbackItem(BaseModel):
    """User feedback item in admin review queue."""
    id: str
    user_id: Optional[str] = None
    user_name: str
    user_email: str
    detection_id: Optional[str] = None
    detection_file_name: Optional[str] = None
    detection_file_url: Optional[str] = None
    detection_verdict: Optional[str] = None
    detection_confidence: Optional[float] = None
    detection_file_type: Optional[str] = None
    subject: Optional[str] = ""
    rating: Optional[int] = None
    comment: str = ""
    status: str = "pending"
    admin_response: Optional[str] = None
    created_at: str


class AdminFeedbackResponse(BaseModel):
    """Paginated feedback management list."""
    feedback: List[AdminFeedbackItem]
    total: int
    page: int
    limit: int
    pages: int


class AdminChartDataPoint(BaseModel):
    """Daily detection breakdown for admin trends."""
    date: str
    authentic: int
    deepfake: int


class AdminChartResponse(BaseModel):
    """Chart data wrapper."""
    chart_data: List[AdminChartDataPoint]
