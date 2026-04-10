"""
AI Configuration
Model paths, supported formats, and AI-specific settings.
"""

import os
from pathlib import Path

# Model paths
AI_MODELS_DIR = Path("ai_models")
IMAGE_MODEL_PATH = AI_MODELS_DIR / "deepvision_image_v1.pth"
VIDEO_MODEL_PATH = AI_MODELS_DIR / "deepvision_video_v1.pth"

# Supported formats
SUPPORTED_IMAGE_FORMATS = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/bmp": [".bmp"],
    "image/tiff": [".tiff", ".tif"]
}

SUPPORTED_VIDEO_FORMATS = {
    "video/mp4": [".mp4"],
    "video/webm": [".webm"],
    "video/quicktime": [".mov"],
    "video/x-msvideo": [".avi"],
    "video/x-ms-wmv": [".wmv"],
    "video/3gpp": [".3gp"]
}

# File size limits (in bytes)
MAX_IMAGE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB

# Processing limits
MAX_VIDEO_DURATION = 300  # 5 minutes in seconds
MIN_IMAGE_RESOLUTION = (224, 224)  # Minimum width, height
MAX_IMAGE_RESOLUTION = (4096, 4096)  # Maximum width, height

# Model settings
IMAGE_MODEL_VERSION = "DeepVision-Image-v1.0"
VIDEO_MODEL_VERSION = "DeepVision-Video-v1.0"
CONFIDENCE_THRESHOLD = 0.5  # Threshold for fake/real classification
BATCH_SIZE = 1  # Process one file at a time

# Device settings
DEVICE = "cuda" if os.environ.get("CUDA_AVAILABLE") == "true" else "cpu"