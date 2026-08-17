"""
DeepVision Core Infrastructure Package
Provides settings, database access, security dependencies, and exception handling.
"""
from .config import settings
from .database import get_supabase
from .dependencies import get_current_user, get_current_admin_user
from .exceptions import CustomAPIException, setup_exception_handlers

__all__ = [
    "settings",
    "get_supabase",
    "get_current_user",
    "get_current_admin_user",
    "CustomAPIException",
    "setup_exception_handlers",
]
