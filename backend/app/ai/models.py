"""
AI Model Loading and Inference
Handles loading and running inference on separate image and video models.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Dict, Any, Optional
import logging
from pathlib import Path
import time
import tempfile
import os
from PIL import Image
import cv2
import torchvision.transforms as transforms

from .config import (
    IMAGE_MODEL_PATH, 
    VIDEO_MODEL_PATH,
    IMAGE_MODEL_VERSION,
    VIDEO_MODEL_VERSION,
    CONFIDENCE_THRESHOLD,
    DEVICE
)

logger = logging.getLogger(__name__)


class ModelLoadError(Exception):
    """Exception raised when model loading fails."""
    pass


class InferenceError(Exception):
    """Exception raised during model inference."""
    pass


class ImageDeepfakeModel:
    """Image deepfake detection model wrapper."""
    
    def __init__(self):
        self.model = None
        self.device = torch.device(DEVICE)
        self.is_loaded = False
        self.transform = self._get_transform()
    
    def _get_transform(self):
        """Get image preprocessing transforms."""
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def load_model(self) -> None:
        """Load the image deepfake detection model."""
        try:
            if not IMAGE_MODEL_PATH.exists():
                raise ModelLoadError(f"Image model not found at {IMAGE_MODEL_PATH}")
            
            logger.info(f"Loading image model from {IMAGE_MODEL_PATH}")
            
            # Load model checkpoint
            checkpoint = torch.load(IMAGE_MODEL_PATH, map_location=self.device)
            
            # Create model architecture (adjust based on your model)
            # This is a placeholder - replace with your actual model architecture
            self.model = self._create_model_architecture()
            
            # Load weights
            if 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
            
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            
            logger.info("Image model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load image model: {e}")
            raise ModelLoadError(f"Failed to load image model: {e}")
    
    def _create_model_architecture(self):
        """Create model architecture - replace with your actual model."""
        # Placeholder model - replace with your trained architecture
        import torchvision.models as models
        
        model = models.efficientnet_b4(pretrained=False)
        model.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(model.classifier[1].in_features, 2)  # 2 classes: real, fake
        )
        return model
    
    def predict(self, image_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
        """
        Predict if image is deepfake.
        
        Returns:
            confidence: float between 0 and 1
            verdict: 'REAL' or 'FAKE'
            details: additional analysis details
        """
        if not self.is_loaded:
            self.load_model()
        
        try:
            start_time = time.time()
            
            # Preprocess image
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(image_bytes)
                temp_path = temp_file.name
            
            try:
                # Load and preprocess image
                image = Image.open(temp_path).convert('RGB')
                input_tensor = self.transform(image).unsqueeze(0).to(self.device)
                
                # Run inference
                with torch.no_grad():
                    outputs = self.model(input_tensor)
                    probabilities = torch.softmax(outputs, dim=1)
                    
                    # Get confidence and prediction
                    fake_confidence = probabilities[0][1].item()  # Probability of being fake
                    real_confidence = probabilities[0][0].item()  # Probability of being real
                    
                    # Determine verdict
                    if fake_confidence > CONFIDENCE_THRESHOLD:
                        verdict = "FAKE"
                        confidence = fake_confidence
                    else:
                        verdict = "REAL"
                        confidence = real_confidence
                
                processing_time = int((time.time() - start_time) * 1000)
                
                # Additional analysis details
                details = {
                    "real_confidence": real_confidence,
                    "fake_confidence": fake_confidence,
                    "processing_time_ms": processing_time,
                    "model_version": IMAGE_MODEL_VERSION,
                    "image_size": image.size,
                    "device_used": str(self.device)
                }
                
                return confidence, verdict, details
            
            finally:
                os.unlink(temp_path)
                
        except Exception as e:
            logger.error(f"Image inference failed: {e}")
            raise InferenceError(f"Image inference failed: {e}")


class VideoDeepfakeModel:
    """Video deepfake detection model wrapper."""
    
    def __init__(self):
        self.model = None
        self.device = torch.device(DEVICE)
        self.is_loaded = False
        self.transform = self._get_transform()
    
    def _get_transform(self):
        """Get video frame preprocessing transforms."""
        return transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def load_model(self) -> None:
        """Load the video deepfake detection model."""
        try:
            if not VIDEO_MODEL_PATH.exists():
                raise ModelLoadError(f"Video model not found at {VIDEO_MODEL_PATH}")
            
            logger.info(f"Loading video model from {VIDEO_MODEL_PATH}")
            
            # Load model checkpoint
            checkpoint = torch.load(VIDEO_MODEL_PATH, map_location=self.device)
            
            # Create model architecture (adjust based on your model)
            self.model = self._create_model_architecture()
            
            # Load weights
            if 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
            
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            
            logger.info("Video model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load video model: {e}")
            raise ModelLoadError(f"Failed to load video model: {e}")
    
    def _create_model_architecture(self):
        """Create video model architecture - replace with your actual model."""
        # Placeholder model - replace with your trained architecture
        # This could be a 3D CNN, LSTM, or other temporal model
        import torchvision.models as models
        
        # Example: Using ResNet3D for video analysis
        model = models.video.r3d_18(pretrained=False)
        model.fc = nn.Linear(model.fc.in_features, 2)  # 2 classes: real, fake
        return model
    
    def _extract_frames(self, video_bytes: bytes, max_frames: int = 16) -> np.ndarray:
        """Extract frames from video for analysis."""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            temp_file.write(video_bytes)
            temp_path = temp_file.name
        
        try:
            cap = cv2.VideoCapture(temp_path)
            frames = []
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_indices = np.linspace(0, total_frames - 1, max_frames, dtype=int)
            
            for frame_idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                if ret:
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(frame)
            
            cap.release()
            return np.array(frames)
        
        finally:
            os.unlink(temp_path)
    
    def predict(self, video_bytes: bytes) -> Tuple[float, str, Dict[str, Any]]:
        """
        Predict if video is deepfake.
        
        Returns:
            confidence: float between 0 and 1
            verdict: 'REAL' or 'FAKE'
            details: additional analysis details
        """
        if not self.is_loaded:
            self.load_model()
        
        try:
            start_time = time.time()
            
            # Extract frames from video
            frames = self._extract_frames(video_bytes)
            
            if len(frames) == 0:
                raise InferenceError("No frames could be extracted from video")
            
            # Preprocess frames
            frame_tensors = []
            for frame in frames:
                frame_tensor = self.transform(frame)
                frame_tensors.append(frame_tensor)
            
            # Stack frames for batch processing
            input_tensor = torch.stack(frame_tensors).unsqueeze(0).to(self.device)
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                
                # Get confidence and prediction
                fake_confidence = probabilities[0][1].item()
                real_confidence = probabilities[0][0].item()
                
                # Determine verdict
                if fake_confidence > CONFIDENCE_THRESHOLD:
                    verdict = "FAKE"
                    confidence = fake_confidence
                else:
                    verdict = "REAL"
                    confidence = real_confidence
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Additional analysis details
            details = {
                "real_confidence": real_confidence,
                "fake_confidence": fake_confidence,
                "processing_time_ms": processing_time,
                "model_version": VIDEO_MODEL_VERSION,
                "frames_analyzed": len(frames),
                "device_used": str(self.device)
            }
            
            return confidence, verdict, details
            
        except Exception as e:
            logger.error(f"Video inference failed: {e}")
            raise InferenceError(f"Video inference failed: {e}")


# Global model instances (lazy loading)
_image_model = None
_video_model = None


def get_image_model() -> ImageDeepfakeModel:
    """Get or create image model instance."""
    global _image_model
    if _image_model is None:
        _image_model = ImageDeepfakeModel()
    return _image_model


def get_video_model() -> VideoDeepfakeModel:
    """Get or create video model instance."""
    global _video_model
    if _video_model is None:
        _video_model = VideoDeepfakeModel()
    return _video_model