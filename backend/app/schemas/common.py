"""
app/schemas/common.py

Shared enums, generic response wrappers, and pagination schemas.
"""

from enum import Enum
from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


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


class FeedbackStatus(str, Enum):
    pending = "pending"
    reviewed = "reviewed"
    resolved = "resolved"


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
    page: int = Field(default=1, ge=1, description="Page number starting at 1")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
