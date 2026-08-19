"""
Hugging Face Space — DeepVision Inference API

This Space loads Hybrid_vit.pth and exposes a simple HTTP endpoint
that the Render backend calls for image deepfake detection.

Deploy this Space at: https://huggingface.co/spaces/Dinesh-18-AIML/deepvision-inference
"""

import io
import gc
import base64
import logging
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models
import torchvision.transforms as T
from PIL import Image
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Model Definition ───────────────────────────────────────────────────────

class HybridViTCNN(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.cnn = models.efficientnet_b0(weights=None)
        self.cnn.classifier = nn.Identity()
        self.vit = models.vit_b_16(weights=None)
        self.vit.heads = nn.Identity()
        self.fc = nn.Sequential(
            nn.Linear(1280 + 768, 1024), nn.BatchNorm1d(1024), nn.SiLU(), nn.Dropout(0.4),
            nn.Linear(1024, 512), nn.BatchNorm1d(512), nn.SiLU(),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        return self.fc(torch.cat((self.cnn(x), self.vit(x)), dim=1))


# ── Load model at startup ──────────────────────────────────────────────────

_model = None
_device = torch.device("cpu")

_transform = T.Compose([
    T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def get_model():
    global _model
    if _model is not None:
        return _model

    model_path = Path("Hybrid_vit.pth")
    if not model_path.exists():
        # Download from HF Hub
        from huggingface_hub import hf_hub_download
        logger.info("Downloading Hybrid_vit.pth from HF Hub...")
        path = hf_hub_download(
            repo_id="Dinesh-18-AIML/deepvision-hybrid-vit",
            filename="Hybrid_vit.pth",
        )
        model_path = Path(path)

    logger.info(f"Loading model from {model_path} ({model_path.stat().st_size / 1e6:.1f}MB)...")
    net = HybridViTCNN(num_classes=2)

    try:
        state = torch.load(model_path, map_location="cpu", weights_only=True)
    except Exception:
        state = torch.load(model_path, map_location="cpu", weights_only=False)

    if isinstance(state, dict) and "model_state_dict" in state:
        state = state["model_state_dict"]

    try:
        net.load_state_dict(state, strict=True)
    except Exception:
        net.load_state_dict(state, strict=False)

    del state
    gc.collect()

    net.eval()
    net = torch.ao.quantization.quantize_dynamic(net, {nn.Linear}, dtype=torch.qint8)
    logger.info("Model ready.")
    _model = net
    return _model


# ── FastAPI app ────────────────────────────────────────────────────────────

app = FastAPI(title="DeepVision Inference API")


class PredictRequest(BaseModel):
    data: list  # [{"image": "<base64>"}]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: PredictRequest):
    try:
        model = get_model()

        # Extract base64 image from request
        item = req.data[0] if req.data else {}
        b64 = item.get("image", "") if isinstance(item, dict) else item
        image_bytes = base64.b64decode(b64)

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = _transform(image).unsqueeze(0)

        with torch.inference_mode():
            logits = model(tensor)
            probs = torch.softmax(logits, dim=1)[0]

        fake_prob = float(probs[0].item())
        real_prob = float(probs[1].item())

        return JSONResponse({
            "data": [{
                "fake_probability": round(fake_prob, 4),
                "real_probability": round(real_prob, 4),
                "verdict": "FAKE" if fake_prob >= 0.5 else "REAL",
            }]
        })

    except Exception as e:
        logger.exception("Prediction failed")
        return JSONResponse(status_code=500, content={"error": str(e)})
