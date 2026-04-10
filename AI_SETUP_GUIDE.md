# DeepVision AI Setup Guide

This guide explains how to set up the AI deepfake detection system with your trained models.

## Overview

The DeepVision system uses separate PyTorch models for image and video deepfake detection:
- **Image Model**: Processes individual images (JPEG, PNG, WebP, etc.)
- **Video Model**: Processes video sequences (MP4, WebM, MOV, etc.)

## Prerequisites

### 1. Install AI Dependencies

```bash
cd backend
pip install torch torchvision opencv-python pillow numpy
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Verify Installation

Run the test script to check dependencies:
```bash
cd backend
python test_ai_integration.py
```

## Model Setup

### 1. Prepare Your Models

Your trained models should be PyTorch `.pth` files with these specifications:

**Image Model (`deepvision_image_v1.pth`)**:
- Input: 224x224x3 RGB images
- Architecture: EfficientNet-B4 or similar CNN
- Output: 2 classes (real=0, fake=1)
- Format: PyTorch state dict or checkpoint

**Video Model (`deepvision_video_v1.pth`)**:
- Input: 16x224x224x3 RGB frame sequences
- Architecture: 3D CNN (ResNet3D-18 or similar)
- Output: 2 classes (real=0, fake=1)
- Format: PyTorch state dict or checkpoint

### 2. Place Model Files

Copy your trained models to the `ai_models/` directory:

```bash
# From your project root
cp /path/to/your/image_model.pth ai_models/deepvision_image_v1.pth
cp /path/to/your/video_model.pth ai_models/deepvision_video_v1.pth
```

### 3. Update Model Architecture (if needed)

If your models use different architectures, update the model creation functions in `backend/app/ai/models.py`:

```python
def _create_model_architecture(self):
    # Replace with your actual model architecture
    import torchvision.models as models
    
    model = models.efficientnet_b4(pretrained=False)
    model.classifier = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.classifier[1].in_features, 2)  # 2 classes: real, fake
    )
    return model
```

## Configuration

### 1. Model Paths

Update paths in `backend/app/ai/config.py` if needed:

```python
IMAGE_MODEL_PATH = AI_MODELS_DIR / "your_image_model.pth"
VIDEO_MODEL_PATH = AI_MODELS_DIR / "your_video_model.pth"
```

### 2. Processing Settings

Adjust settings based on your models:

```python
CONFIDENCE_THRESHOLD = 0.5  # Classification threshold
MIN_IMAGE_RESOLUTION = (224, 224)  # Minimum input size
MAX_VIDEO_DURATION = 300  # Maximum video length (seconds)
DEVICE = "cuda"  # Use "cpu" if no GPU available
```

### 3. File Format Support

Add/remove supported formats in `config.py`:

```python
SUPPORTED_IMAGE_FORMATS = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    # Add more formats as needed
}
```

## Testing

### 1. Test AI Integration

```bash
cd backend
python test_ai_integration.py
```

This will check:
- ✅ Dependencies installed
- ✅ Model files present
- ✅ Validation working
- ✅ Model loading status

### 2. Test via API

Start the backend server:
```bash
cd backend
python -m uvicorn main:app --reload
```

Check model status (admin required):
```bash
curl -X GET "http://localhost:8000/api/v1/admin/ai-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Test detection:
```bash
curl -X POST "http://localhost:8000/api/v1/detection/analyze" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -F "file=@test_image.jpg"
```

## Model Training Tips

If you need to train your own models:

### 1. Image Model Training

```python
import torch
import torch.nn as nn
import torchvision.models as models

# Create model
model = models.efficientnet_b4(pretrained=True)
model.classifier = nn.Sequential(
    nn.Dropout(0.4),
    nn.Linear(model.classifier[1].in_features, 2)
)

# Train your model...
# Save trained model
torch.save(model.state_dict(), 'deepvision_image_v1.pth')
```

### 2. Video Model Training

```python
import torchvision.models.video as video_models

# Create 3D model for video
model = video_models.r3d_18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, 2)

# Train your model...
# Save trained model
torch.save(model.state_dict(), 'deepvision_video_v1.pth')
```

## Troubleshooting

### Common Issues

**1. Model Loading Errors**
```
Error: Failed to load image model: ...
```
- Check model file exists in `ai_models/`
- Verify model architecture matches in `models.py`
- Check PyTorch version compatibility

**2. CUDA Errors**
```
Error: CUDA out of memory
```
- Set `DEVICE = "cpu"` in config.py
- Reduce batch size or image resolution

**3. Validation Errors**
```
ValidationError: Unsupported file type
```
- Check file format is in `SUPPORTED_*_FORMATS`
- Verify file is not corrupted
- Check file size limits

**4. Import Errors**
```
ModuleNotFoundError: No module named 'torch'
```
- Install missing dependencies: `pip install torch torchvision opencv-python`

### Debug Mode

Enable detailed logging in `backend/app/ai/detector.py`:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Performance Optimization

**For Production:**
1. Use GPU if available (`DEVICE = "cuda"`)
2. Optimize model architecture for inference
3. Consider model quantization
4. Use batch processing for multiple files

**For Development:**
1. Use CPU for easier debugging (`DEVICE = "cpu"`)
2. Reduce model complexity
3. Use smaller test files

## Integration Flow

The complete detection flow:

1. **Upload** → User uploads image/video via API
2. **Validate** → File format, size, resolution checked
3. **Preprocess** → Media converted to model input format
4. **Detect** → Appropriate model (image/video) runs inference
5. **Postprocess** → Results formatted and confidence calculated
6. **Store** → Results saved to database with metadata
7. **Return** → API returns verdict and confidence to user

## API Endpoints

### User Endpoints
- `POST /api/v1/detection/analyze` - Upload and analyze media
- `GET /api/v1/detection/history` - Get detection history
- `GET /api/v1/detection/{id}` - Get specific detection result

### Admin Endpoints
- `GET /api/v1/admin/ai-status` - Check model loading status
- `GET /api/v1/admin/stats` - Platform statistics
- `GET /api/v1/admin/models` - Model management

## Next Steps

1. **Add Your Models**: Place `.pth` files in `ai_models/`
2. **Test Integration**: Run `python test_ai_integration.py`
3. **Start Backend**: `uvicorn main:app --reload`
4. **Test API**: Upload test files via frontend or curl
5. **Monitor Performance**: Check admin dashboard for model status

For questions or issues, check the logs in the backend console or contact the development team.