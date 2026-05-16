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

# Configuration constants
SUPPORTED_IMAGE_FORMATS = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/bmp': ['.bmp']
}
SUPPORTED_VIDEO_FORMATS = {
    'video/mp4': ['.mp4'],
    'video/x-msvideo': ['.avi'],
    'video/quicktime': ['.mov'],
    'video/x-matroska': ['.mkv'],
    'video/webm': ['.webm']
}
MAX_IMAGE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
MAX_VIDEO_DURATION = 300  # 5 minutes
MIN_IMAGE_RESOLUTION = (100, 100)
MAX_IMAGE_RESOLUTION = (8000, 8000)
MIN_VIDEO_RESOLUTION = (100, 100)
MAX_VIDEO_RESOLUTION = (4000, 4000)


class ValidationError(Exception):
    """Custom exception for validation errors with user-friendly messages."""
    
    def __init__(self, message: str, error_code: str = "VALIDATION_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class MediaValidator:
    """Professional media validation with detailed checks."""
    
    @staticmethod
    def _is_blank_image(img: Image.Image) -> bool:
        """Check if image is blank (all pixels same or very similar color)."""
        try:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Get image statistics
            extrema = img.getextrema()
            
            # Check if all channels have very small range (indicating blank image)
            for channel_min, channel_max in extrema:
                if channel_max - channel_min > 10:  # Some variation exists
                    return False
            
            return True  # All channels have minimal variation
        except:
            return False
    
    @staticmethod
    def validate_file_extension(filename: str, content_type: str) -> str:
        """Validate file extension matches content type."""
        if not filename:
            raise ValidationError(
                "No filename provided. Please upload a valid file.",
                "MISSING_FILENAME"
            )
        
        file_ext = Path(filename).suffix.lower()
        
        if not file_ext:
            raise ValidationError(
                f"File '{filename}' has no extension. Please upload a file with a valid extension (e.g., .jpg, .png, .mp4).",
                "MISSING_EXTENSION"
            )
        
        # Check image formats
        for mime_type, extensions in SUPPORTED_IMAGE_FORMATS.items():
            if content_type == mime_type:
                if file_ext not in extensions:
                    raise ValidationError(
                        f"File extension '{file_ext}' doesn't match the file type. Expected one of: {', '.join(extensions)}",
                        "EXTENSION_MISMATCH",
                        {"expected": extensions, "got": file_ext}
                    )
                return "image"
        
        # Check video formats
        for mime_type, extensions in SUPPORTED_VIDEO_FORMATS.items():
            if content_type == mime_type:
                if file_ext not in extensions:
                    raise ValidationError(
                        f"File extension '{file_ext}' doesn't match the file type. Expected one of: {', '.join(extensions)}",
                        "EXTENSION_MISMATCH",
                        {"expected": extensions, "got": file_ext}
                    )
                return "video"
        
        # Provide helpful error message with supported formats
        supported_image_exts = [ext for exts in SUPPORTED_IMAGE_FORMATS.values() for ext in exts]
        supported_video_exts = [ext for exts in SUPPORTED_VIDEO_FORMATS.values() for ext in exts]
        
        raise ValidationError(
            f"Unsupported file type: {content_type}. "
            f"Supported image formats: {', '.join(supported_image_exts)}. "
            f"Supported video formats: {', '.join(supported_video_exts)}.",
            "UNSUPPORTED_FORMAT",
            {"content_type": content_type, "extension": file_ext}
        )
    
    @staticmethod
    def validate_file_size(file_bytes: bytes, media_type: str) -> None:
        """Validate file size based on media type."""
        file_size = len(file_bytes)
        
        if file_size < 100:  # Less than 100 bytes
            raise ValidationError(
                "File is too small or empty. Please upload a valid media file.",
                "FILE_TOO_SMALL",
                {"size_bytes": file_size}
            )
        
        if media_type == "image":
            if file_size > MAX_IMAGE_SIZE:
                max_mb = MAX_IMAGE_SIZE / (1024 * 1024)
                actual_mb = file_size / (1024 * 1024)
                raise ValidationError(
                    f"Image file is too large ({actual_mb:.1f}MB). Maximum allowed size is {max_mb:.0f}MB. "
                    f"Please compress your image or upload a smaller file.",
                    "FILE_TOO_LARGE",
                    {"size_bytes": file_size, "max_bytes": MAX_IMAGE_SIZE}
                )
        elif media_type == "video":
            if file_size > MAX_VIDEO_SIZE:
                max_mb = MAX_VIDEO_SIZE / (1024 * 1024)
                actual_mb = file_size / (1024 * 1024)
                raise ValidationError(
                    f"Video file is too large ({actual_mb:.1f}MB). Maximum allowed size is {max_mb:.0f}MB. "
                    f"Please compress your video or upload a shorter clip.",
                    "FILE_TOO_LARGE",
                    {"size_bytes": file_size, "max_bytes": MAX_VIDEO_SIZE}
                )
    
    @staticmethod
    def validate_image_properties(file_bytes: bytes) -> Tuple[int, int, str]:
        """Validate image properties and return dimensions and format."""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
            
            try:
                # Open and validate image - first pass for verification
                img = Image.open(temp_path)
                try:
                    img.verify()
                except Exception as e:
                    img.close()
                    raise ValidationError(
                        "Image file is corrupted or invalid. Please try uploading a different image.",
                        "CORRUPTED_IMAGE",
                        {"error": str(e)}
                    )
                finally:
                    img.close()
                
                # Reopen after verify (verify closes the file)
                img = Image.open(temp_path)
                try:
                    width, height = img.size
                    format_name = img.format or "UNKNOWN"
                    
                    # Check resolution limits FIRST (before blank check)
                    if width < MIN_IMAGE_RESOLUTION[0] or height < MIN_IMAGE_RESOLUTION[1]:
                        raise ValidationError(
                            f"Image resolution is too low ({width}x{height}). "
                            f"Minimum required: {MIN_IMAGE_RESOLUTION[0]}x{MIN_IMAGE_RESOLUTION[1]} pixels. "
                            f"Please upload a higher quality image.",
                            "RESOLUTION_TOO_LOW",
                            {"width": width, "height": height, "min_width": MIN_IMAGE_RESOLUTION[0], "min_height": MIN_IMAGE_RESOLUTION[1]}
                        )
                    
                    if width > MAX_IMAGE_RESOLUTION[0] or height > MAX_IMAGE_RESOLUTION[1]:
                        raise ValidationError(
                            f"Image resolution is too high ({width}x{height}). "
                            f"Maximum allowed: {MAX_IMAGE_RESOLUTION[0]}x{MAX_IMAGE_RESOLUTION[1]} pixels. "
                            f"Please resize your image.",
                            "RESOLUTION_TOO_HIGH",
                            {"width": width, "height": height, "max_width": MAX_IMAGE_RESOLUTION[0], "max_height": MAX_IMAGE_RESOLUTION[1]}
                        )
                    
                    # Check if image is blank (all pixels same color)
                    if MediaValidator._is_blank_image(img):
                        raise ValidationError(
                            "Image appears to be blank or empty. Please upload an image with actual content.",
                            "BLANK_IMAGE"
                        )
                    
                    # Check aspect ratio (extremely unusual ratios might indicate issues)
                    aspect_ratio = width / height
                    if aspect_ratio > 10 or aspect_ratio < 0.1:
                        raise ValidationError(
                            f"Image has an unusual aspect ratio ({width}x{height}). "
                            f"Please upload an image with a more standard aspect ratio.",
                            "UNUSUAL_ASPECT_RATIO",
                            {"width": width, "height": height, "aspect_ratio": aspect_ratio}
                        )
                    
                    return width, height, format_name
                finally:
                    img.close()
            
            finally:
                # Clean up temp file
                os.unlink(temp_path)
                
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(
                f"Unable to process image file. The file may be corrupted or in an unsupported format. Error: {str(e)}",
                "IMAGE_PROCESSING_ERROR",
                {"error": str(e)}
            )
    
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
                    raise ValidationError(
                        "Cannot open video file. The file may be corrupted, incomplete, or in an unsupported format. "
                        "Please try re-exporting your video or use a different file.",
                        "CORRUPTED_VIDEO"
                    )
                
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
                
                # Try to read first frame to verify video is not blank/corrupted
                ret, first_frame = cap.read()
                if not ret or first_frame is None:
                    cap.release()
                    raise ValidationError(
                        "Video file appears to be empty or corrupted. Unable to read video frames. "
                        "Please upload a valid video file.",
                        "BLANK_VIDEO"
                    )
                
                cap.release()
                
                # Validate properties
                if width < MIN_VIDEO_RESOLUTION[0] or height < MIN_VIDEO_RESOLUTION[1]:
                    raise ValidationError(
                        f"Video resolution is too low ({width}x{height}). "
                        f"Minimum required: {MIN_VIDEO_RESOLUTION[0]}x{MIN_VIDEO_RESOLUTION[1]} pixels. "
                        f"Please upload a higher quality video.",
                        "VIDEO_RESOLUTION_TOO_LOW",
                        {"width": width, "height": height}
                    )
                
                if width > MAX_VIDEO_RESOLUTION[0] or height > MAX_VIDEO_RESOLUTION[1]:
                    raise ValidationError(
                        f"Video resolution is too high ({width}x{height}). "
                        f"Maximum allowed: {MAX_VIDEO_RESOLUTION[0]}x{MAX_VIDEO_RESOLUTION[1]} pixels. "
                        f"Please resize your video.",
                        "VIDEO_RESOLUTION_TOO_HIGH",
                        {"width": width, "height": height}
                    )
                
                if duration > MAX_VIDEO_DURATION:
                    raise ValidationError(
                        f"Video is too long ({duration:.1f} seconds). "
                        f"Maximum allowed duration is {MAX_VIDEO_DURATION} seconds ({MAX_VIDEO_DURATION // 60} minutes). "
                        f"Please upload a shorter video clip.",
                        "VIDEO_TOO_LONG",
                        {"duration": duration, "max_duration": MAX_VIDEO_DURATION}
                    )
                
                if duration < 0.1:
                    raise ValidationError(
                        "Video is too short (less than 0.1 seconds). Please upload a longer video clip.",
                        "VIDEO_TOO_SHORT",
                        {"duration": duration}
                    )
                
                if fps < 1:
                    raise ValidationError(
                        "Video has an invalid frame rate. The file may be corrupted.",
                        "INVALID_FRAME_RATE",
                        {"fps": fps}
                    )
                
                if frame_count < 2:
                    raise ValidationError(
                        "Video has too few frames. The file may be corrupted or incomplete.",
                        "INSUFFICIENT_FRAMES",
                        {"frame_count": frame_count}
                    )
                
                return width, height, duration, fps, codec
            
            finally:
                # Clean up temp file
                os.unlink(temp_path)
                
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(
                f"Unable to process video file. The file may be corrupted or in an unsupported format. Error: {str(e)}",
                "VIDEO_PROCESSING_ERROR",
                {"error": str(e)}
            )
    
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