"""
app/api/v1/router.py

API v1 Central Router Aggregator.
"""

from fastapi import APIRouter

from app.api.v1.detection import router as detection_router
from app.api.v1.user import router as user_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(detection_router)
api_v1_router.include_router(user_router)
api_v1_router.include_router(admin_router)
