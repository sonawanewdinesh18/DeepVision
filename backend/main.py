"""
main.py — DeepVision FastAPI Application Entry Point

Starts the API server, registers all routers, configures middleware,
and wires up global exception handling.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.api.v1 import detection as detection_router
from app.api.v1 import user as user_router
from app.api.v1 import admin as admin_router

# ── Application Instance ─────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered deepfake detection API.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── Exception Handlers ───────────────────────────────────────

setup_exception_handlers(app)

# ── CORS ─────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers ──────────────────────────────────────────────

app.include_router(detection_router.router, prefix="/api/v1")
app.include_router(user_router.router, prefix="/api/v1")
app.include_router(admin_router.router, prefix="/api/v1")

# ── Health Check ─────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ── Dev Entry Point ──────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )