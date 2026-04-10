"""
Media Validation
Professional validation for uploaded images and videos.
"""

import mimetypes
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image
import cv2
import tempfile
import os

from .config import (
    SUPPORTED_IMAGE_FORMATS, 
    SUPPORTED_VIDEO_FORMATS,
    MAX_IMAGE_SIZE, 
    MAX_VIDEO_SIZE,
    MAX_VIDEO_DURATION,
    MIN_IMAGE_RESOLUTION,
    MAX_IMAGE_RESOLUTION
)


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class MediaValidator:
    """Professional media validation with detailed checks."""
    
    @staticmethod
    def validate_file_extension(filename: str, content_type: str) -> str:
        """Validate file extension matches content type."""
        if not filename:
            raise ValidationError("Filename is required")
        
        file_ext = Path(filename).suffix.lower()
        
        # Check image formats
        for mime_type, extensions in SUPPORTED_IMAGE_FORMATS.items():
            if content_type == mime_type:
                if file_ext not in extensions:
                    raise ValidationError(f"File extension {file_ext} doesn't match content type {content_type}")
                return "image"
        
        # Check video formats
        for mime_type, extensions in SUPPORTED_VIDEO_FORMATS.items():
            if content_type == mime_type:
                if file_ext not in extensions:
                    raise ValidationError(f"File extension {file_ext} doesn't match content type {content_type}")
                return "video"
        
        raise ValidationError(f"Unsupported file type: {content_type}")
    
    @staticmethod
    def validate_file_size(file_bytes: bytes, media_type: str) -> None:
        """Validate file size based on media type."""
        file_size = len(file_bytes)
        
        if media_type == "image":
            if file_size > MAX_IMAGE_SIZE:
                raise ValidationError(f"Image size {file_size / (1024*1024):.1f}MB exceeds maximum {MAX_IMAGE_SIZE / (1024*1024)}MB")
        elif media_type == "video":
            if file_size > MAX_VIDEO_SIZE:
                raise ValidationError(f"Video size {file_size / (1024*1024):.1f}MB exceeds maximum {MAX_VIDEO_SIZE / (1024*1024)}MB")
        
        if file_size < 1024:  # Less than 1KB
            raise ValidationError("File is too small to be a valid media file")
    
    @staticmethod
    def validate_image_properties(file_bytes: bytes) -> Tuple[int, int, str]:
        """Validate image properties and return dimensions and format."""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
            
            try:
                # Open and validate image
                with Image.open(temp_path) as img:
                    width, height = img.size
                    format_name = img.format or "UNKNOWN"
                    
                    # Check resolution limits
                    if width < MIN_IMAGE_RESOLUTION[0] or height < MIN_IMAGE_RESOLUTION[1]:
                        raise ValidationError(f"Image resolution {width}x{height} is below minimum {MIN_IMAGE_RESOLUTION[0]}x{MIN_IMAGE_RESOLUTION[1]}")
                    
                    if width > MAX_IMAGE_RESOLUTION[0] or height > MAX_IMAGE_RESOLUTION[1]:
                        raise ValidationError(f"Image resolution {width}x{height} exceeds maximum {MAX_IMAGE_RESOLUTION[0]}x{MAX_IMAGE_RESOLUTION[1]}")
                    
                    # Check if image is corrupted
                    img.verify()
                    
                    return width, height, format_name
            
            finally:
                # Clean up temp file
                os.unlink(temp_path)
                
        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError(f"Invalid or corrupted image: {str(e)}")
    
    @staticmethod
    def validate_video_properties(file_bytes: bytes) -> Tuple[int, int, float, float, str]:
        """Validate video properties and return width, height, duration, fps, codec."""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
            
            try:
                # Open video with OpenCV
                cap = cv2.VideoCapture(temp_path)
                
                if not cap.isOpened():
                    raise ValidationError("Cannot open video file - file may be corrupted")
                
                # Get video properties
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                
                # Calculate duration
                duration = frame_count / fps if fps > 0 else 0
                
                # Get codec information
                fourcc = int(cap.get(cv2.CAP_PROP_FOURCC))
                codec = "".join([chr((fourcc >> 8 * i) & 0xFF) for i in range(4)])
                
                cap.release()
                
                # Validate properties
                if width < MIN_IMAGE_RESOLUTION[0] or height < MIN_IMAGE_RESOLUTION[1]:
                    raise ValidationError(f"Video resolution {width}x{height} is below minimum {MIN_IMAGE_RESOLUTION[0]}x{MIN_IMAGE_RESOLUTION[1]}")
                
                if duration > MAX_VIDEO_DURATION:
                    raise ValidationError(f"Video duration {duration:.1f}s exceeds maximum {MAX_VIDEO_DURATION}s")
                
                if duration < 0.1:
                    raise ValidationError("Video is too short (less than 0.1 seconds)")
                
                if fps < 1:
                    raise ValidationError("Invalid video frame rate")
                
                return width, height, duration, fps, codec
            
            finally:
                # Clean up temp file
                os.unlink(temp_path)
                
        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError(f"Invalid or corrupted video: {str(e)}")
    
    @classmethod
    def validate_media_file(cls, file_bytes: bytes, filename: str, content_type: str) -> dict:
        """Complete media file validation."""
        # Step 1: Validate extension and determine media type
        media_type = cls.validate_file_extension(filename, content_type)
        
        # Step 2: Validate file size
        cls.validate_file_size(file_bytes, media_type)
        
        # Step 3: Validate media-specific properties
        if media_type == "image":
            width, height, format_name = cls.validate_image_properties(file_bytes)
            return {
                "media_type": media_type,
                "width": width,
                "height": height,
                "format": format_name,
                "file_size": len(file_bytes),
                "is_valid": True
            }
        
        elif media_type == "video":
            width, height, duration, fps, codec = cls.validate_video_properties(file_bytes)
            return {
                "media_type": media_type,
                "width": width,
                "height": height,
                "duration": duration,
                "fps": fps,
                "codec": codec,
                "file_size": len(file_bytes),
                "is_valid": True
            }
        
        raise ValidationError(f"Unknown media type: {media_type}")