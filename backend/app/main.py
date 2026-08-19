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
from app.api.v1.router import api_v1_router

# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("deepvision")


# ── Application Lifespan ──────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application Lifespan Events.
    Kicks off background model download and loading on boot so the model is
    warmed up and resident in RAM before the first user inference request arrives.
    """
    import asyncio
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.ENVIRONMENT})...")

    # Pre-warm model in background thread immediately on startup
    async def _warmup_model():
        try:
            from app.engine.model import load_model
            logger.info("Lifespan: Starting background model pre-warming...")
            await asyncio.to_thread(load_model)
            logger.info("Lifespan: Model successfully pre-warmed and ready.")
        except Exception as e:
            logger.warning(f"Lifespan: Background model pre-warming note: {e}")

    asyncio.create_task(_warmup_model())

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

    # 2. CORS Middleware (Supports Vercel deployments, custom domains, and local dev with credentials)
    origins = settings.ALLOWED_ORIGINS
    if isinstance(origins, str):
        origins = [origins]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != ["*"] else ["*"],
        allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # 3. Real-Time No-Cache & Response Headers Middleware
    @app.middleware("http")
    async def add_no_cache_headers(request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        origin = request.headers.get("origin")
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.exception(f"Unhandled error in HTTP middleware: {exc}")
            from fastapi.responses import JSONResponse
            response = JSONResponse(
                status_code=500,
                content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": str(exc)}}
            )

        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        if origin and "access-control-allow-origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Expose-Headers"] = "*"
        return response



    # 4. Mount Routers
    app.include_router(api_v1_router)

    # 4. Health & Status Endpoints
    @app.api_route("/", methods=["GET", "HEAD"], tags=["Health"], summary="API Root / Status")
    @app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"], summary="Health check probe")
    def health_check():
        from app.engine.model import get_model_status
        model_status = get_model_status()
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "model": model_status,
        }

    return app


app = create_application()


if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG or settings.ENVIRONMENT == "development",
        log_level="debug" if settings.DEBUG else "info",
    )
