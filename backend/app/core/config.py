"""
app/core/config.py

Centralized settings management using pydantic-settings.
Values are dynamically loaded from environment variables or .env file.
"""

from functools import lru_cache
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────
    APP_NAME: str = "DeepVision API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── CORS / Allowed Origins ────────────────────────────────
    # Accepts comma-separated string ("http://localhost:5173,http://localhost:3000") or list
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str):
            if value.strip() == "*":
                return ["*"]
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    # ── Supabase ──────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_STORAGE_BUCKET: str = "detection-media"

    # ── AI Model Configuration ────────────────────────────────
    MODEL_PATH: str = "./models/Hybrid_vit.pth"
    MODEL_VERSION: str = "HybridViTCNN-v1.0"
    CONFIDENCE_THRESHOLD: float = 0.5
    VIDEO_SAMPLE_FRAMES: int = 16
    DEVICE: str = "auto"  # 'auto', 'cuda', 'cpu', 'mps'

    # ── File Limits ───────────────────────────────────────────
    MAX_IMAGE_SIZE_BYTES: int = 50 * 1024 * 1024     # 50 MB
    MAX_VIDEO_SIZE_BYTES: int = 500 * 1024 * 1024   # 500 MB
    MAX_VIDEO_DURATION_SECONDS: int = 300           # 5 minutes

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def resolve_model_path(self) -> Path:
        """
        Intelligently locate the Hybrid_vit.pth model weights.
        Checks:
          1. Direct path configured in MODEL_PATH
          2. backend/models/Hybrid_vit.pth
          3. Sibling ai_models/Hybrid_vit.pth (Monorepo root)
        """
        # 1. Configured path
        configured = Path(self.MODEL_PATH)
        if configured.is_file():
            return configured.resolve()

        # 2. Local backend/models/ directory
        backend_dir = Path(__file__).resolve().parent.parent.parent
        local_model = backend_dir / "models" / "Hybrid_vit.pth"
        if local_model.is_file():
            return local_model.resolve()

        # 3. Monorepo root ai_models/ directory
        monorepo_model = backend_dir.parent / "ai_models" / "Hybrid_vit.pth"
        if monorepo_model.is_file():
            return monorepo_model.resolve()

        # Fallback to configured path (will trigger clear error on model load)
        return configured.resolve()


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()


settings = get_settings()
