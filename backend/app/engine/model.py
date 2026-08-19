"""
app/engine/model.py

PyTorch HybridViTCNN definition and singleton weights loader.

Architecture:
    CNN Branch : EfficientNet-B0  → 1280-dim features
    ViT Branch : ViT-B/16         → 768-dim  features
    Fusion Head: Concat (2048)    → Linear(1024) → BN → SiLU → Dropout(0.4)
                                  → Linear(512)  → BN → SiLU → Linear(2)

Class label mapping (ImageFolder convention):
    Class 0 = Fake (deepfake)
    Class 1 = Real (authentic)

Production deployment (Render free tier):
    - Uses Hybrid_vit_int8.pth (183MB INT8 quantized) bundled in the Docker image.
    - No runtime download needed; model is available immediately at /app/models/.
    - Peak RAM usage ~280MB — fits within Render's 512MB free tier.
"""

import gc
import time
import logging
import threading
from pathlib import Path
from typing import Tuple, Optional
import torch
import torch.nn as nn
from torchvision import models

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Thread-safe singleton ──────────────────────────────────────────────────
_model_instance: Optional[nn.Module] = None
_device_instance: Optional[torch.device] = None
_load_lock = threading.Lock()


class ModelLoadError(Exception):
    """Raised when model weights cannot be loaded."""
    pass


class InferenceError(Exception):
    """Raised when model forward pass fails."""
    pass


# ── Model Architecture ─────────────────────────────────────────────────────

class HybridViTCNN(nn.Module):
    """Hybrid deepfake classifier: EfficientNet-B0 + ViT-B/16 fusion."""

    def __init__(self, num_classes: int = 2) -> None:
        super().__init__()

        self.cnn = models.efficientnet_b0(weights=None)
        cnn_out = self.cnn.classifier[1].in_features  # 1280
        self.cnn.classifier = nn.Identity()

        self.vit = models.vit_b_16(weights=None)
        vit_out = self.vit.heads.head.in_features      # 768
        self.vit.heads = nn.Identity()

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
        return self.fc(torch.cat((self.cnn(x), self.vit(x)), dim=1))


# ── Device Resolution ──────────────────────────────────────────────────────

def resolve_device() -> torch.device:
    """Pick best available compute device respecting DEVICE config."""
    cfg = settings.DEVICE.lower()
    if cfg == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    if cfg == "mps" and getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    if cfg == "cpu":
        return torch.device("cpu")
    # auto
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


# ── Weight Loader ──────────────────────────────────────────────────────────

def load_model() -> Tuple[nn.Module, torch.device]:
    """
    Thread-safe singleton loader.

    Load priority:
      1. Already loaded — return cached instance immediately.
      2. INT8 quantized weights bundled in Docker image (/app/models/Hybrid_vit_int8.pth).
      3. Full weights (Hybrid_vit.pth) if INT8 not found.
      4. Download full weights from Hugging Face as last resort.
    """
    global _model_instance, _device_instance

    # Fast path — already loaded
    if _model_instance is not None and _device_instance is not None:
        return _model_instance, _device_instance

    with _load_lock:
        # Double-checked locking
        if _model_instance is not None and _device_instance is not None:
            return _model_instance, _device_instance

        device = resolve_device()
        if device.type == "cpu":
            torch.set_num_threads(1)

        model_path = settings.resolve_model_path()
        is_int8 = "int8" in model_path.name.lower()

        # If model file is missing, fall back to full model or download
        if not model_path.exists() or model_path.stat().st_size < 10 * 1024 * 1024:
            logger.warning(f"Model not found at {model_path}, attempting download...")
            _download_weights(model_path)

        if model_path.exists() and model_path.stat().st_size > 10 * 1024 * 1024:
            net = _load_weights(model_path, device, is_int8=is_int8)
            if net is not None:
                _model_instance = net
                _device_instance = device
                return _model_instance, _device_instance

        raise ModelLoadError(
            f"Could not load model from {model_path}. "
            "Ensure Hybrid_vit_int8.pth is bundled in the Docker image at /app/models/."
        )


def _load_weights(model_path: Path, device: torch.device, is_int8: bool) -> Optional[nn.Module]:
    """Load and return the model from a .pth file. Returns None on failure."""
    try:
        logger.info(f"Loading {'INT8 ' if is_int8 else ''}weights from {model_path} on {device}...")
        t0 = time.perf_counter()

        net = HybridViTCNN(num_classes=2)

        # Try progressively more permissive load strategies
        state = None
        for kwargs in [
            {"map_location": "cpu", "weights_only": True},
            {"map_location": "cpu", "weights_only": False},
        ]:
            try:
                state = torch.load(model_path, **kwargs)
                break
            except Exception:
                continue

        if state is None:
            logger.warning(f"All load strategies failed for {model_path}")
            return None

        if isinstance(state, dict) and "model_state_dict" in state:
            state = state["model_state_dict"]

        # Load state dict — try strict first, then relaxed
        try:
            net.load_state_dict(state, strict=True)
        except Exception:
            net.load_state_dict(state, strict=False)
            logger.warning("Loaded weights with strict=False (some keys mismatched)")

        del state
        gc.collect()

        net.to(device)
        net.eval()

        # Apply dynamic INT8 quantization on CPU if not already quantized
        if device.type == "cpu" and not is_int8:
            try:
                net = torch.ao.quantization.quantize_dynamic(
                    net, {nn.Linear}, dtype=torch.qint8
                )
                logger.info("Applied dynamic INT8 quantization.")
            except Exception as qe:
                logger.debug(f"Quantization skipped: {qe}")

        elapsed = (time.perf_counter() - t0) * 1000
        logger.info(f"Model ready in {elapsed:.0f}ms on {device}")
        return net

    except Exception as e:
        logger.error(f"Failed to load weights from {model_path}: {e}")
        return None


def _download_weights(target_path: Path) -> bool:
    """Download model weights from Hugging Face as a last resort."""
    import urllib.request

    url = settings.MODEL_DOWNLOAD_URL
    if not url:
        logger.warning("No MODEL_DOWNLOAD_URL configured, cannot download.")
        return False

    logger.info(f"Downloading weights from {url} → {target_path}")
    target_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = target_path.with_suffix(".tmp")

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DeepVision/1.0"})
        with urllib.request.urlopen(req, timeout=180) as resp, open(tmp, "wb") as f:
            while chunk := resp.read(4 * 1024 * 1024):
                f.write(chunk)

        if tmp.stat().st_size > 10 * 1024 * 1024:
            tmp.replace(target_path)
            logger.info(f"Downloaded {target_path.stat().st_size / 1e6:.1f}MB")
            return True

        tmp.unlink(missing_ok=True)
        return False

    except Exception as e:
        logger.error(f"Download failed: {e}")
        tmp.unlink(missing_ok=True)
        return False


# ── Status ─────────────────────────────────────────────────────────────────

def get_model_status() -> dict:
    """Return diagnostic info about the loaded model."""
    global _model_instance, _device_instance
    model_path = settings.resolve_model_path()
    size_mb = round(model_path.stat().st_size / 1e6, 1) if model_path.exists() else 0

    if _model_instance is not None and _device_instance is not None:
        return {
            "loaded": True,
            "model_type": type(_model_instance).__name__,
            "version": settings.MODEL_VERSION,
            "device": str(_device_instance),
            "weights_file": model_path.name,
            "weights_size_mb": size_mb,
            "status": "ready",
        }
    return {
        "loaded": False,
        "model_type": "none",
        "version": settings.MODEL_VERSION,
        "device": "cpu",
        "weights_file": model_path.name,
        "weights_size_mb": size_mb,
        "status": "not loaded yet",
    }
