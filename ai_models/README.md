# AI Models Directory

This directory contains the trained deepfake detection models for the DeepVision system.

## Required Model Files

Place your trained PyTorch model files (.pth) in this directory:

1. **Image Model**: `deepvision_image_v1.pth`
   - Trained model for image deepfake detection
   - Should accept 224x224 RGB images
   - Output: 2 classes (real, fake)

2. **Video Model**: `deepvision_video_v1.pth`
   - Trained model for video deepfake detection
   - Should accept sequences of 224x224 RGB frames
   - Output: 2 classes (real, fake)

## Model Architecture Requirements

### Image Model
- Input: Batch of 224x224x3 RGB images
- Architecture: EfficientNet-B4 or similar
- Output: 2-class logits (real, fake)

### Video Model
- Input: Batch of 16x224x224x3 RGB frame sequences
- Architecture: 3D CNN (ResNet3D-18 or similar)
- Output: 2-class logits (real, fake)

## Model Loading

The system will automatically load these models when:
1. The detection service starts
2. A detection request is made
3. An admin checks model status

## Configuration

Model paths and settings can be configured in `backend/app/ai/config.py`:
- `IMAGE_MODEL_PATH`: Path to image model
- `VIDEO_MODEL_PATH`: Path to video model
- `CONFIDENCE_THRESHOLD`: Classification threshold (default: 0.5)
- `DEVICE`: Processing device (cuda/cpu)

## Testing Models

To test if your models are working:
1. Place the .pth files in this directory
2. Start the backend server
3. Check model status via admin API: `GET /api/v1/admin/ai-status`
4. Upload a test image/video via the detection API

## Model Format

Models should be saved as PyTorch state dictionaries:
```python
torch.save(model.state_dict(), 'deepvision_image_v1.pth')
```

Or as complete checkpoints:
```python
torch.save({
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'epoch': epoch,
    'loss': loss,
}, 'deepvision_image_v1.pth')
```

## Troubleshooting

If models fail to load:
1. Check file names match exactly
2. Verify model architecture in `backend/app/ai/models.py`
3. Check logs for specific error messages
4. Ensure PyTorch dependencies are installed
5. Verify CUDA availability if using GPU