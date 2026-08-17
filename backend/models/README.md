# Model Weights Directory

Place your pre-trained `Hybrid_vit.pth` model file in this directory:
```
backend/models/Hybrid_vit.pth
```

### Automatic Model Fallback
The backend automatically resolves the model in the following order:
1. `MODEL_PATH` defined in your `.env` file (e.g. `/path/to/Hybrid_vit.pth`)
2. `backend/models/Hybrid_vit.pth` (Local models directory)
3. `../ai_models/Hybrid_vit.pth` (Monorepo root `ai_models/` folder)

If using CUDA/GPU, ensure your environment has the appropriate PyTorch build installed.
