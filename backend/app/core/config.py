"""
app/core/config.py
Centralized settings management using pydantic-settings.
All configuration is loaded from environment variables / .env file.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "DeepVision API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Security ─────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    ADMIN_EMAIL: str = "admin@deepvision.com"  # Default admin email

    # ── Supabase ─────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_STORAGE_BUCKET: str = "detection-media"
    USE_SUPABASE_STORAGE: bool = True

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = ""
    dB_password: str = ""

    # ── Payment ──────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""

    # ── AI Model ─────────────────────────────────────────────
    MODEL_PATH: str = "./models/deepvision_v1.pth"

    # ── Frontend ─────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton — call anywhere via Depends(get_settings)."""
    return Settings()


# Module-level instance for simple imports
settings = get_settings()
