"""
app/engine/validator.py

Professional validation for uploaded images and videos.
Performs MIME checks, dimension constraints, and file integrity verifications.
"""

import os
import tempfile
from pathlib import Path
from typing import Dict, Any, Tuple
import cv2
from PIL import Image

from app.core.config import settings

SUPPORTED_IMAGE_FORMATS = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/bmp": [".bmp"],
}

SUPPORTED_VIDEO_FORMATS = {
    "video/mp4": [".mp4"],
    "video/webm": [".webm"],
    "video/quicktime": [".mov"],
    "video/x-msvideo": [".avi"],
}


class ValidationError(Exception):
    """Raised when an uploaded file fails validation checks."""
    pass


class MediaValidator:
    """Validates media files before AI inference."""

    @staticmethod
    def resolve_media_type(filename: str, content_type: str) -> str:
        """Verify extension and MIME type, returning 'image' or 'video'."""
        ext = Path(filename).suffix.lower() if filename else ""

        # Check images
        for mime, extensions in SUPPORTED_IMAGE_FORMATS.items():
            if content_type == mime or ext in extensions:
                return "image"

        # Check videos
        for mime, extensions in SUPPORTED_VIDEO_FORMATS.items():
            if content_type == mime or ext in extensions:
                return "video"

        raise ValidationError(
            f"Unsupported file format: '{content_type}' ({ext}). "
            f"Allowed image types: JPEG, PNG, WebP, BMP. Allowed video types: MP4, WebM, MOV, AVI."
        )

    @staticmethod
    def validate_file_size(file_bytes: bytes, media_type: str) -> None:
        """Ensure file size is within configured limits."""
        size = len(file_bytes)
        if size < 1024:
            raise ValidationError("Uploaded file is too small or empty (< 1 KB).")

        if media_type == "image" and size > settings.MAX_IMAGE_SIZE_BYTES:
            max_mb = settings.MAX_IMAGE_SIZE_BYTES // (1024 * 1024)
            raise ValidationError(f"Image size exceeds the {max_mb} MB maximum limit.")

        if media_type == "video" and size > settings.MAX_VIDEO_SIZE_BYTES:
            max_mb = settings.MAX_VIDEO_SIZE_BYTES // (1024 * 1024)
            raise ValidationError(f"Video size exceeds the {max_mb} MB maximum limit.")

    @staticmethod
    def validate_image(file_bytes: bytes) -> Dict[str, Any]:
        """Verify image can be opened and decoded without corruption."""
        tmp_path = ""
        try:
            with tempfile.NamedTemporaryFile(delete=False) as f:
                f.write(file_bytes)
                tmp_path = f.name

            with Image.open(tmp_path) as img:
                img.verify()
                width, height = img.size
                format_name = img.format or "UNKNOWN"

            if width < 32 or height < 32:
                raise ValidationError(f"Image resolution {width}x{height} is too small for analysis.")

            return {
                "media_type": "image",
                "width": width,
                "height": height,
                "format": format_name,
                "file_size": len(file_bytes),
                "is_valid": True,
            }

        except ValidationError:
            raise
        except Exception as exc:
            raise ValidationError(f"Corrupted or unreadable image file: {exc}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

    @staticmethod
    def validate_video(file_bytes: bytes) -> Dict[str, Any]:
        """Verify video can be decoded and respects duration constraints."""
        tmp_path = ""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as f:
                f.write(file_bytes)
                tmp_path = f.name

            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                raise ValidationError("Unable to decode video file. The file may be corrupted.")

            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration_sec = frame_count / fps if fps > 0 else 0.0

            cap.release()

            if duration_sec > settings.MAX_VIDEO_DURATION_SECONDS:
                max_m = settings.MAX_VIDEO_DURATION_SECONDS // 60
                raise ValidationError(
                    f"Video duration ({duration_sec:.1f}s) exceeds the maximum allowed ({max_m} minutes)."
                )

            if duration_sec < 0.1:
                raise ValidationError("Video is too short (< 0.1 seconds).")

            return {
                "media_type": "video",
                "width": width,
                "height": height,
                "duration_seconds": round(duration_sec, 2),
                "fps": round(fps, 2),
                "frame_count": frame_count,
                "file_size": len(file_bytes),
                "is_valid": True,
            }

        except ValidationError:
            raise
        except Exception as exc:
            raise ValidationError(f"Corrupted or unreadable video file: {exc}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

    @classmethod
    def validate_media_file(cls, file_bytes: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Perform end-to-end media validation."""
        media_type = cls.resolve_media_type(filename, content_type)
        cls.validate_file_size(file_bytes, media_type)

        if media_type == "image":
            return cls.validate_image(file_bytes)
        elif media_type == "video":
            return cls.validate_video(file_bytes)

        raise ValidationError(f"Unknown media type for: {filename}")
