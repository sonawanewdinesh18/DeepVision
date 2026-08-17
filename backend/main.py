"""
main.py — DeepVision Backend Entrypoint

Exposes the FastAPI application instance for Uvicorn and production ASGI servers.
Run with:
    uvicorn main:app --reload
or
    uvicorn app.main:app --reload
"""

import uvicorn
from app.main import app, create_application
from app.core.config import settings

__all__ = ["app", "create_application"]

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG or settings.ENVIRONMENT == "development",
        log_level="info",
    )