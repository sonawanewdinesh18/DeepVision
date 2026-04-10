#!/usr/bin/env python3
"""
Model Placeholder Generator
Creates dummy .pth files for testing the AI integration without real models.
"""

import torch
import torch.nn as nn
import torchvision.models as models
from pathlib import Path


def create_dummy_image_model():
    """Create a dummy image model for testing."""
    model = models.efficientnet_b4(pretrained=False)
    model.classifier = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.classifier[1].in_features, 2)  # 2 classes: real, fake
    )
    return model


def create_dummy_video_model():
    """Create a dummy video model for testing."""
    model = models.video.r3d_18(pretrained=False)
    model.fc = nn.Linear(model.fc.in_features, 2)  # 2 classes: real, fake
    return model


def save_placeholder_models():
    """Save placeholder models for testing."""
    print("Creating placeholder models for testing...")
    
    # Create models
    image_model = create_dummy_image_model()
    video_model = create_dummy_video_model()
    
    # Save models
    image_path = Path("deepvision_image_v1.pth")
    video_path = Path("deepvision_video_v1.pth")
    
    torch.save(image_model.state_dict(), image_path)
    torch.save(video_model.state_dict(), video_path)
    
    print(f"✅ Created placeholder image model: {image_path}")
    print(f"✅ Created placeholder video model: {video_path}")
    print("\n⚠️  These are DUMMY models for testing only!")
    print("   Replace with your trained models for real detection.")


if __name__ == "__main__":
    save_placeholder_models()