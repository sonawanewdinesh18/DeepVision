"""
app/core/config.py

Centralized settings management using pydantic-settings.
Values are dynamically loaded from environment variables or .env file.
"""

from functools import lru_cache
from pathlib import Path
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────
    APP_NAME: str = "DeepVision API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── CORS / Allowed Origins ────────────────────────────────
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "https://deep-vision-five.vercel.app",
        "https://deepvision-five.vercel.app",
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
    # In production (Render free), MODEL_PATH should point to the INT8
    # quantized weights (183MB) which fit comfortably in 512MB RAM.
    # Set via env var: MODEL_PATH=./models/Hybrid_vit_int8.pth
    MODEL_PATH: str = "./models/Hybrid_vit.pth"
    MODEL_VERSION: str = "HybridViTCNN-v1.0"
    # Primary download URL — full model from Hugging Face
    MODEL_DOWNLOAD_URL: Optional[str] = "https://huggingface.co/Dinesh-18-AIML/deepvision-hybrid-vit/resolve/main/Hybrid_vit.pth"
    CONFIDENCE_THRESHOLD: float = 0.5
    VIDEO_SAMPLE_FRAMES: int = 8   # Reduced for free-tier memory headroom
    DEVICE: str = "cpu"            # Render free has no GPU

    # ── File Limits ───────────────────────────────────────────
    MAX_IMAGE_SIZE_BYTES: int = 20 * 1024 * 1024   # 20 MB (reduced for free tier)
    MAX_VIDEO_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB
    MAX_VIDEO_DURATION_SECONDS: int = 120           # 2 minutes

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def resolve_model_path(self) -> Path:
        """
        Locate model weights. Search order:
          1. Sanitize if a URL was accidentally passed as MODEL_PATH
          2. Exact path in MODEL_PATH env var
          3. backend/models/Hybrid_vit_int8.pth  (production Docker image)
          4. backend/models/Hybrid_vit.pth        (full model fallback)
          5. Monorepo ai_models/ directory         (local dev)
        """
        backend_dir = Path(__file__).resolve().parent.parent.parent

        # 1. Ignore URL values
        if self.MODEL_PATH.startswith("http://") or self.MODEL_PATH.startswith("https://"):
            return (backend_dir / "models" / "Hybrid_vit_int8.pth").resolve()

        # 2. Configured path
        configured = Path(self.MODEL_PATH)
        if configured.is_file():
            return configured.resolve()

        # 3. INT8 quantized model in backend/models/
        int8_model = backend_dir / "models" / "Hybrid_vit_int8.pth"
        if int8_model.is_file():
            return int8_model.resolve()

        # 4. Full model in backend/models/
        full_model = backend_dir / "models" / "Hybrid_vit.pth"
        if full_model.is_file():
            return full_model.resolve()

        # 5. Monorepo root ai_models/ — try INT8 first, then full
        for name in ("Hybrid_vit_int8.pth", "Hybrid_vit.pth"):
            monorepo_model = backend_dir.parent / "ai_models" / name
            if monorepo_model.is_file():
                return monorepo_model.resolve()

        # Default fallback path (will trigger download if not found)
        return (backend_dir / "models" / "Hybrid_vit_int8.pth").resolve()

@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()


settings = get_settings()
