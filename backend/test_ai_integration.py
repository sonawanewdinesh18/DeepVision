#!/usr/bin/env python3
"""
Test script for AI integration
Tests the AI detection pipeline without actual model files.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ai.detector import detection_engine
from app.ai.validators import MediaValidator, ValidationError
from app.services.detection_service import detection_service


async def test_validation():
    """Test media validation without models."""
    print("🔍 Testing media validation...")
    
    validator = MediaValidator()
    
    # Test cases
    test_cases = [
        ("test.jpg", "image/jpeg", b"fake_image_data"),
        ("test.mp4", "video/mp4", b"fake_video_data"),
        ("test.txt", "text/plain", b"not_media"),
    ]
    
    for filename, content_type, data in test_cases:
        try:
            media_type = validator.validate_file_extension(filename, content_type)
            print(f"  ✅ {filename} ({content_type}) -> {media_type}")
        except ValidationError as e:
            print(f"  ❌ {filename} ({content_type}) -> {e}")
        except Exception as e:
            print(f"  ⚠️  {filename} ({content_type}) -> Unexpected error: {e}")


def test_model_status():
    """Test model status checking."""
    print("\n🤖 Testing model status...")
    
    try:
        status = detection_service.get_model_status()
        print(f"  📊 Model Status: {status}")
        
        image_loaded = status.get("image_model", {}).get("loaded", False)
        video_loaded = status.get("video_model", {}).get("loaded", False)
        
        if image_loaded:
            print("  ✅ Image model loaded successfully")
        else:
            print("  ⚠️  Image model not loaded (expected without .pth files)")
            
        if video_loaded:
            print("  ✅ Video model loaded successfully")
        else:
            print("  ⚠️  Video model not loaded (expected without .pth files)")
            
    except Exception as e:
        print(f"  ❌ Model status check failed: {e}")


async def test_detection_pipeline():
    """Test detection pipeline (will fail without models, but should handle gracefully)."""
    print("\n🔬 Testing detection pipeline...")
    
    # Create fake image data
    fake_image_data = b"fake_jpeg_header" + b"\x00" * 1000
    
    try:
        result = await detection_engine.detect_deepfake(
            file_bytes=fake_image_data,
            filename="test.jpg",
            content_type="image/jpeg"
        )
        print(f"  ✅ Detection completed: {result['verdict']} ({result['confidence']:.3f})")
    except ValidationError as e:
        print(f"  ⚠️  Validation failed (expected): {e}")
    except Exception as e:
        print(f"  ⚠️  Detection failed (expected without models): {e}")


def check_dependencies():
    """Check if required dependencies are available."""
    print("📦 Checking dependencies...")
    
    dependencies = [
        ("torch", "PyTorch"),
        ("torchvision", "TorchVision"),
        ("cv2", "OpenCV"),
        ("PIL", "Pillow"),
        ("numpy", "NumPy")
    ]
    
    missing = []
    for module, name in dependencies:
        try:
            __import__(module)
            print(f"  ✅ {name} available")
        except ImportError:
            print(f"  ❌ {name} missing")
            missing.append(name)
    
    if missing:
        print(f"\n⚠️  Missing dependencies: {', '.join(missing)}")
        print("   Install with: pip install torch torchvision opencv-python pillow numpy")
        return False
    
    return True


def check_model_files():
    """Check if model files exist."""
    print("\n📁 Checking model files...")
    
    from app.ai.config import IMAGE_MODEL_PATH, VIDEO_MODEL_PATH
    
    if IMAGE_MODEL_PATH.exists():
        print(f"  ✅ Image model found: {IMAGE_MODEL_PATH}")
    else:
        print(f"  ⚠️  Image model missing: {IMAGE_MODEL_PATH}")
        
    if VIDEO_MODEL_PATH.exists():
        print(f"  ✅ Video model found: {VIDEO_MODEL_PATH}")
    else:
        print(f"  ⚠️  Video model missing: {VIDEO_MODEL_PATH}")
    
    if not IMAGE_MODEL_PATH.exists() and not VIDEO_MODEL_PATH.exists():
        print("   📝 See ai_models/README.md for model setup instructions")


async def main():
    """Run all tests."""
    print("🚀 DeepVision AI Integration Test\n")
    
    # Check dependencies first
    if not check_dependencies():
        print("\n❌ Cannot proceed without required dependencies")
        return
    
    # Check model files
    check_model_files()
    
    # Run tests
    await test_validation()
    test_model_status()
    await test_detection_pipeline()
    
    print("\n✨ Test completed!")
    print("   If models are missing, add .pth files to ai_models/ directory")
    print("   See ai_models/README.md for detailed instructions")


if __name__ == "__main__":
    asyncio.run(main())