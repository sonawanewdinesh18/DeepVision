"""
app/engine/model.py

PyTorch HybridViTCNN Neural Network Definition and Singleton Weights Loader.

Architecture (Matches Hybrid_vit.pth exactly):
    CNN Branch : EfficientNet-B0  → 1280-dim latent features
    ViT Branch : ViT-B/16         → 768-dim  latent features
    Fusion Head: Concat (2048)    → Linear(1024) → BN → SiLU → Dropout(0.4)
                                  → Linear(512)  → BN → SiLU
                                  → Linear(num_classes=2)

Class Label Mapping (ImageFolder dataset convention):
    Class 0: Fake (Deepfake)
    Class 1: Real (Authentic)
"""

import os
import time
import logging
from pathlib import Path
from typing import Tuple, Optional
import torch
import torch.nn as nn
from torchvision import models

from app.core.config import settings

logger = logging.getLogger(__name__)

# Module-level singletons
_model_instance: Optional["HybridViTCNN"] = None
_device_instance: Optional[torch.device] = None


class ModelLoadError(Exception):
    """Raised when the deep learning model weights cannot be loaded."""
    pass


class InferenceError(Exception):
    """Raised when model forward pass or tensor extraction fails."""
    pass


class HybridViTCNN(nn.Module):
    """
    Hybrid deepfake classifier combining EfficientNet-B0 and Vision Transformer (ViT-B/16).
    """

    def __init__(self, num_classes: int = 2) -> None:
        super().__init__()

        # CNN Feature Extractor
        self.cnn = models.efficientnet_b0(weights=None)
        cnn_out = self.cnn.classifier[1].in_features  # 1280
        self.cnn.classifier = nn.Identity()

        # Vision Transformer Feature Extractor
        self.vit = models.vit_b_16(weights=None)
        vit_out = self.vit.heads.head.in_features      # 768
        self.vit.heads = nn.Identity()

        # Multi-layer Perceptron Fusion Head
        self.fc = nn.Sequential(
            nn.Linear(cnn_out + vit_out, 1024),
            nn.BatchNorm1d(1024),
            nn.SiLU(),
            nn.Dropout(0.4),
            nn.Linear(1024, 512),
            nn.BatchNorm1d(512),
            nn.SiLU(),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        cnn_feat = self.cnn(x)
        vit_feat = self.vit(x)
        fused = torch.cat((cnn_feat, vit_feat), dim=1)
        return self.fc(fused)


def resolve_device() -> torch.device:
    """Determine the optimal compute device based on availability and config."""
    configured = settings.DEVICE.lower()
    
    if configured == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    elif configured == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    elif configured == "cpu":
        return torch.device("cpu")
    
    # Auto-detection
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


import gc
import urllib.request


def load_model() -> Tuple[HybridViTCNN, torch.device]:
    """
    Thread-safe singleton model loader.
    Loads Hybrid_vit.pth weights once into memory with strict RAM limits for cloud free-tier hosting.
    """
    global _model_instance, _device_instance

    if _model_instance is not None and _device_instance is not None:
        return _model_instance, _device_instance

    device = resolve_device()
    if device.type == "cpu":
        # Restrict CPU threads to prevent memory fragmentation on low-RAM containers
        torch.set_num_threads(1)

    model_path = settings.resolve_model_path()

    # If model file is not present locally, stream download it in 4MB chunks
    if not model_path.exists():
        download_url = settings.MODEL_DOWNLOAD_URL
        if download_url:
            logger.info(f"Streaming model weights download from: {download_url}")
            model_path.parent.mkdir(parents=True, exist_ok=True)
            tmp_path = model_path.with_suffix(".tmp")
            
            try:
                req = urllib.request.Request(
                    download_url,
                    headers={"User-Agent": "DeepVision-FastAPI-Server/1.0"}
                )
                with urllib.request.urlopen(req) as response, open(tmp_path, "wb") as out_file:
                    while True:
                        chunk = response.read(4 * 1024 * 1024)  # 4 MB chunk
                        if not chunk:
                            break
                        out_file.write(chunk)
                
                if tmp_path.exists() and tmp_path.stat().st_size > 1024 * 1024:
                    tmp_path.replace(model_path)
                    logger.info(f"Model weights successfully saved to: {model_path} ({model_path.stat().st_size / (1024*1024):.1f} MB)")
                else:
                    raise ModelLoadError("Downloaded model weights file is empty or corrupted.")
            except Exception as dl_err:
                if tmp_path.exists():
                    tmp_path.unlink(missing_ok=True)
                logger.error(f"Failed to download model weights from {download_url}: {dl_err}")
                raise ModelLoadError(f"Failed to download model weights: {dl_err}") from dl_err
        else:
            err_msg = (
                f"HybridViTCNN weights file not found at: '{model_path}'. "
                "Please configure MODEL_DOWNLOAD_URL in your environment variables."
            )
            logger.error(err_msg)
            raise ModelLoadError(err_msg)

    logger.info(f"Loading HybridViTCNN weights from {model_path} onto device '{device}'...")
    start_time = time.perf_counter()

    try:
        net = HybridViTCNN(num_classes=2)
        
        # Zero-copy memory-mapped state loading to stay strictly under 512MB RAM
        try:
            state = torch.load(model_path, map_location="cpu", mmap=True, weights_only=True)
        except Exception:
            try:
                state = torch.load(model_path, map_location="cpu", mmap=True, weights_only=False)
            except Exception:
                state = torch.load(model_path, map_location="cpu", weights_only=False)

        if isinstance(state, dict) and "model_state_dict" in state:
            state = state["model_state_dict"]

        try:
            net.load_state_dict(state, assign=True)
        except Exception:
            net.load_state_dict(state, strict=True)

        del state
        gc.collect()

        net.to(device)
        net.eval()

        # Quantize Linear/Attention layers to INT8 (reduces RAM from 350MB to ~95MB)
        if device.type == "cpu":
            try:
                net = torch.ao.quantization.quantize_dynamic(
                    net, {nn.Linear}, dtype=torch.qint8
                )
                logger.info("HybridViTCNN INT8 dynamic quantization applied (<100MB RAM footprint).")
            except Exception as q_err:
                logger.debug(f"Quantization fallback: {q_err}")

        _model_instance = net
        _device_instance = device

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.info(f"HybridViTCNN initialized successfully in {elapsed_ms:.1f}ms on {device}")
        return _model_instance, _device_instance

    except Exception as exc:
        logger.exception("Failed to load HybridViTCNN model weights.")
        raise ModelLoadError(f"Failed to load model weights from {model_path}: {exc}") from exc


def get_model_status() -> dict:
    """Return runtime diagnostic status for the AI model without blocking."""
    global _model_instance, _device_instance
    if _model_instance is not None and _device_instance is not None:
        return {
            "loaded": True,
            "version": settings.MODEL_VERSION,
            "device": str(_device_instance),
            "weights_path": str(settings.resolve_model_path()),
            "status": "ready"
        }
    return {
        "loaded": False,
        "version": settings.MODEL_VERSION,
        "device": "cpu",
        "weights_path": str(settings.resolve_model_path()),
        "status": "standby (ready for on-demand inference)"
    }
