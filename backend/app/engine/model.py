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
    - Model weights are baked into Docker image at build time (no runtime download).
    - If somehow missing, falls back to downloading from Hugging Face.
    - Peak RAM usage ~280MB after INT8 quantization — fits in 512MB free tier.
"""

import gc
import time
import logging
import threading
import urllib.request
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
_download_in_progress = False


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
    """Pick best available compute device."""
    cfg = settings.DEVICE.lower()
    if cfg == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    if cfg == "mps" and getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    if cfg == "cpu":
        return torch.device("cpu")
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


# ── Weight Downloader ──────────────────────────────────────────────────────

def _download_weights(target_path: Path) -> bool:
    """
    Download model weights from Hugging Face.
    Blocks until complete. Called in a background thread.
    """
    global _download_in_progress

    url = settings.MODEL_DOWNLOAD_URL
    if not url:
        logger.warning("No MODEL_DOWNLOAD_URL configured.")
        return False

    if _download_in_progress:
        logger.info("Download already in progress, skipping duplicate.")
        return False

    _download_in_progress = True
    logger.info(f"Downloading model weights from {url}")
    target_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = target_path.with_suffix(".tmp")

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DeepVision/1.0"})
        with urllib.request.urlopen(req, timeout=300) as resp, open(tmp, "wb") as f:
            downloaded = 0
            while True:
                chunk = resp.read(4 * 1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                logger.info(f"Downloading... {downloaded / 1e6:.0f}MB")

        if tmp.exists() and tmp.stat().st_size > 10 * 1024 * 1024:
            tmp.replace(target_path)
            logger.info(f"Model downloaded: {target_path.stat().st_size / 1e6:.1f}MB at {target_path}")
            return True

        tmp.unlink(missing_ok=True)
        logger.error("Downloaded file is too small or empty.")
        return False

    except Exception as e:
        logger.error(f"Download failed: {e}")
        tmp.unlink(missing_ok=True)
        return False
    finally:
        _download_in_progress = False


# ── Weight Loader ──────────────────────────────────────────────────────────

def load_model() -> Tuple[nn.Module, torch.device]:
    """
    Thread-safe singleton loader. Loads model weights and returns (model, device).
    If model file is missing, downloads it first (blocking).
    """
    global _model_instance, _device_instance

    # Fast path
    if _model_instance is not None and _device_instance is not None:
        return _model_instance, _device_instance

    with _load_lock:
        if _model_instance is not None and _device_instance is not None:
            return _model_instance, _device_instance

        device = resolve_device()
        if device.type == "cpu":
            torch.set_num_threads(1)

        model_path = settings.resolve_model_path()

        # Download if missing (fallback — should be baked in via Docker)
        if not model_path.exists() or model_path.stat().st_size < 10 * 1024 * 1024:
            logger.warning(f"Model missing at {model_path} — downloading from Hugging Face...")
            success = _download_weights(model_path)
            if not success:
                raise ModelLoadError(
                    "Model weights could not be loaded or downloaded. "
                    f"Expected at: {model_path}"
                )

        net = _load_weights(model_path, device)
        if net is None:
            raise ModelLoadError(f"Failed to load model weights from {model_path}")

        _model_instance = net
        _device_instance = device
        return _model_instance, _device_instance


def _trim_memory() -> None:
    """Force Python garbage collection and release freed C-heap to OS kernel."""
    gc.collect()
    try:
        import ctypes
        libc = ctypes.CDLL("libc.so.6")
        libc.malloc_trim(0)
    except Exception:
        pass


def _load_weights(model_path: Path, device: torch.device) -> Optional[nn.Module]:
    """
    Load weights from a .pth file into HybridViTCNN with minimal memory footprint.
    Uses memory mapping, in-place key popping, and glibc malloc_trim to fit safely
    within 512MB RAM on free-tier cloud containers.
    """
    try:
        logger.info(f"Loading weights from {model_path} ({model_path.stat().st_size / 1e6:.1f}MB) on {device}...")
        t0 = time.perf_counter()

        _trim_memory()
        torch.set_num_threads(1)

        loaded_obj = None
        for kwargs in [
            {"map_location": "cpu", "weights_only": False, "mmap": True},
            {"map_location": "cpu", "weights_only": True, "mmap": True},
            {"map_location": "cpu", "weights_only": False},
        ]:
            try:
                loaded_obj = torch.load(model_path, **kwargs)
                break
            except Exception as load_err:
                logger.debug(f"torch.load attempt with {kwargs} failed: {load_err}")
                continue

        if loaded_obj is None:
            logger.error(f"Could not read weights from {model_path}")
            return None

        # 1. If saved as full nn.Module instance
        if isinstance(loaded_obj, nn.Module):
            net = loaded_obj
            net.to(device)
            net.eval()
            _trim_memory()
            elapsed = (time.perf_counter() - t0) * 1000
            logger.info(f"Model (full module) ready in {elapsed:.0f}ms on {device}")
            return net

        state = loaded_obj
        metadata = getattr(state, "_metadata", None) if isinstance(state, dict) else None
        if isinstance(state, dict):
            if "model_state_dict" in state:
                state = state["model_state_dict"]
                if hasattr(state, "_metadata") and metadata is None:
                    metadata = state._metadata
            elif "state_dict" in state:
                state = state["state_dict"]
                if hasattr(state, "_metadata") and metadata is None:
                    metadata = state._metadata

            # Normalize key prefixes if needed while preserving _metadata
            needs_rename = any(k.startswith("module.") or k.startswith("model.") for k in state.keys())
            if needs_rename:
                clean_state = {}
                for k in list(state.keys()):
                    v = state.pop(k)
                    clean_k = k
                    if clean_k.startswith("module."):
                        clean_k = clean_k[7:]
                    if clean_k.startswith("model."):
                        clean_k = clean_k[6:]
                    clean_state[clean_k] = v
                if metadata is not None:
                    setattr(clean_state, "_metadata", metadata)
                state = clean_state
            elif metadata is not None and not hasattr(state, "_metadata"):
                setattr(state, "_metadata", metadata)

        del loaded_obj
        _trim_memory()

        with torch.no_grad():
            net = HybridViTCNN(num_classes=2)

            # 2. Check if checkpoint is pre-quantized (contains _packed_params keys)
            is_quantized = isinstance(state, dict) and any("_packed_params" in k for k in state.keys())

            if is_quantized:
                logger.info("Detected pre-quantized INT8 state dict. Quantizing architecture before loading...")
                net = torch.ao.quantization.quantize_dynamic(net, {nn.Linear}, dtype=torch.qint8)
                try:
                    net.load_state_dict(state, strict=True)
                    logger.info("Successfully loaded pre-quantized INT8 weights with 100% key fidelity.")
                except Exception as e:
                    logger.warning(f"Strict load on quantized state failed: {e}. Falling back to strict=False.")
                    net.load_state_dict(state, strict=False)
            else:
                # 3. Standard Float32 weights — load then quantize immediately
                try:
                    net.load_state_dict(state, strict=True)
                    logger.info("Successfully loaded Float32 weights (strict=True).")
                except Exception as e:
                    logger.warning(f"Strict load failed ({e}). Falling back to strict=False.")
                    net.load_state_dict(state, strict=False)

                del state
                _trim_memory()

                # Apply dynamic quantization on CPU to compress from ~350MB -> ~120MB RAM
                if device.type == "cpu":
                    try:
                        net = torch.ao.quantization.quantize_dynamic(
                            net, {nn.Linear}, dtype=torch.qint8
                        )
                        logger.info("Dynamic INT8 quantization applied — RAM usage reduced to ~120MB.")
                    except Exception as qe:
                        logger.debug(f"Dynamic quantization note: {qe}")

            net.to(device)
            net.eval()

        _trim_memory()
        elapsed = (time.perf_counter() - t0) * 1000
        logger.info(f"HybridViTCNN model ready in {elapsed:.0f}ms on {device}")
        return net

    except Exception as e:
        logger.error(f"Failed to load weights: {e}", exc_info=True)
        return None


# ── Status ─────────────────────────────────────────────────────────────────

def get_model_status() -> dict:
    """Return current model status for health check."""
    global _model_instance, _device_instance, _download_in_progress
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

    status = "downloading..." if _download_in_progress else "not loaded yet"
    return {
        "loaded": False,
        "model_type": "none",
        "version": settings.MODEL_VERSION,
        "device": "cpu",
        "weights_file": model_path.name,
        "weights_size_mb": size_mb,
        "status": status,
    }
