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

    # ── AI Model ──────────────────────────────────────────────
    # Points to Hybrid_vit_int8.pth (192MB INT8 quantized model).
    # Loads directly with PyTorch dynamic quantization in ~140MB RAM.
    MODEL_PATH: str = "./models/Hybrid_vit_int8.pth"
    MODEL_VERSION: str = "HybridViTCNN-v1.0-INT8"
    MODEL_DOWNLOAD_URL: Optional[str] = "https://huggingface.co/Dinesh-18-AIML/deepvision-hybrid-vit/resolve/main/Hybrid_vit_int8.pth"
    CONFIDENCE_THRESHOLD: float = 0.5
    VIDEO_SAMPLE_FRAMES: int = 8
    DEVICE: str = "cpu"

    # ── File Limits ───────────────────────────────────────────
    MAX_IMAGE_SIZE_BYTES: int = 20 * 1024 * 1024
    MAX_VIDEO_SIZE_BYTES: int = 100 * 1024 * 1024
    MAX_VIDEO_DURATION_SECONDS: int = 120

    # ── HF Space Inference API (optional, for zero-RAM mode) ──
    USE_HF_API: bool = False
    HF_API_URL: str = ""
    HF_API_TOKEN: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def resolve_model_path(self) -> Path:
        """
        Locate model weights. Search order:
          1. Sanitize URL accidentally passed as MODEL_PATH
          2. Exact configured path (MODEL_PATH env var)
          3. /app/models/Hybrid_vit_int8.pth
          4. Monorepo ai_models/ dir (local dev)
        """
        backend_dir = Path(__file__).resolve().parent.parent.parent

        if self.MODEL_PATH.startswith("http"):
            return (backend_dir / "models" / "Hybrid_vit_int8.pth").resolve()

        configured = Path(self.MODEL_PATH)
        if configured.is_file():
            return configured.resolve()

        local_int8 = backend_dir / "models" / "Hybrid_vit_int8.pth"
        if local_int8.is_file():
            return local_int8.resolve()

        local_float = backend_dir / "models" / "Hybrid_vit.pth"
        if local_float.is_file():
            return local_float.resolve()

        for name in ("Hybrid_vit_int8.pth", "Hybrid_vit.pth", "Hybrid_vit_quantized.pth"):
            dev = backend_dir.parent / "ai_models" / name
            if dev.is_file():
                return dev.resolve()

        return (backend_dir / "models" / "Hybrid_vit_int8.pth").resolve()


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
