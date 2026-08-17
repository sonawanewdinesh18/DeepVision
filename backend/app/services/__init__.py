"""
DeepVision Business Services Package
Exports singleton services for detection, user operations, and administration.
"""

from .detection_service import detection_service, DetectionService
from .user_service import user_service, UserService
from .admin_service import admin_service, AdminService

__all__ = [
    "detection_service",
    "DetectionService",
    "user_service",
    "UserService",
    "admin_service",
    "AdminService",
]
