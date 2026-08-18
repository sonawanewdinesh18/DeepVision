"""
app/main.py — DeepVision FastAPI Application Factory

Configures the application lifespan, global middleware, exception handlers,
and registers API routers.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.engine.model import load_model, ModelLoadError
from app.api.v1.router import api_v1_router

# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("deepvision")


import asyncio


# ── Application Lifespan ──────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan events:
      - Startup: Immediate port binding + non-blocking background model initialization.
      - Shutdown: Release GPU/CPU resources.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.ENVIRONMENT})...")

    # Pre-warm the quantized model in a non-blocking background thread
    async def _preload_model_task():
        try:
            await asyncio.to_thread(load_model)
            logger.info("HybridViTCNN model pre-warmed and ready for inference.")
        except Exception as exc:
            logger.warning(f"Model pre-warming note: {exc}. Model will load on demand.")

    asyncio.create_task(_preload_model_task())

    yield

    logger.info("Shutting down DeepVision API...")


# ── FastAPI App Instance ──────────────────────────────────────

def create_application() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="DeepVision — Enterprise-Grade Deepfake Detection API (Hybrid ViT + CNN).",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # 1. Global Exception Handlers
    setup_exception_handlers(app)

    # 2. CORS Middleware (Supports any web origin, mobile scheme, or wildcard)
    origins = settings.ALLOWED_ORIGINS
    allow_all = "*" in origins or origins == ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if allow_all else origins,
        allow_credentials=not allow_all,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 3. Real-Time No-Cache Middleware (Ensures clients always receive fresh database data)
    @app.middleware("http")
    async def add_no_cache_headers(request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    # 4. Mount Routers
    app.include_router(api_v1_router)

    # 4. Health & Status Endpoints
    @app.api_route("/", methods=["GET", "HEAD"], tags=["Health"], summary="API Root / Status")
    @app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"], summary="Health check probe")
    def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    return app


app = create_application()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG or settings.ENVIRONMENT == "development",
        log_level="debug" if settings.DEBUG else "info",
    )
