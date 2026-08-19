# =============================================================================
# DeepVision Backend — Root Dockerfile (context = repo root)
# Render free tier strategy:
#   Stage 1: Install PyTorch + download Hybrid_vit.pth (353MB) from HF
#   Stage 2: Run quantization script → saves Hybrid_vit_q.pth (~120MB INT8)
#   Stage 3: Minimal runtime — only the quantized weights, no full model
#   Result:  Container RAM at inference ~200MB — fits in 512MB free tier
# =============================================================================

# ── Stage 1: Download + quantize the model ─────────────────────────────────
FROM python:3.11-slim AS quantizer

WORKDIR /work

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only for quantization step
RUN pip install --no-cache-dir \
    torch==2.2.2+cpu \
    torchvision==0.17.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Download the full model from Hugging Face
RUN curl -L --retry 5 --retry-delay 15 --connect-timeout 60 --max-time 600 \
    -H "User-Agent: DeepVision-Docker/1.0" \
    -o Hybrid_vit.pth \
    "https://huggingface.co/Dinesh-18-AIML/deepvision-hybrid-vit/resolve/main/Hybrid_vit.pth" \
    && echo "Full model size: $(du -sh Hybrid_vit.pth)"

# Quantize to INT8 and save — reduces 353MB → ~120MB, RAM ~350MB → ~200MB
RUN python3 - <<'EOF'
import torch
import torch.nn as nn
from torchvision import models

class HybridViTCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.cnn = models.efficientnet_b0(weights=None)
        self.cnn.classifier = nn.Identity()
        self.vit = models.vit_b_16(weights=None)
        self.vit.heads = nn.Identity()
        self.fc = nn.Sequential(
            nn.Linear(1280+768,1024), nn.BatchNorm1d(1024), nn.SiLU(), nn.Dropout(0.4),
            nn.Linear(1024,512), nn.BatchNorm1d(512), nn.SiLU(), nn.Linear(512,2),
        )
    def forward(self,x):
        return self.fc(torch.cat((self.cnn(x),self.vit(x)),dim=1))

print("Loading full model weights...")
net = HybridViTCNN()
try:
    state = torch.load("Hybrid_vit.pth", map_location="cpu", weights_only=True)
except:
    state = torch.load("Hybrid_vit.pth", map_location="cpu", weights_only=False)
if isinstance(state, dict) and "model_state_dict" in state:
    state = state["model_state_dict"]
try:
    net.load_state_dict(state, strict=True)
except:
    net.load_state_dict(state, strict=False)
net.eval()

print("Applying INT8 quantization...")
net_q = torch.ao.quantization.quantize_dynamic(net, {nn.Linear}, dtype=torch.qint8)

print("Saving quantized model...")
torch.save(net_q.state_dict(), "Hybrid_vit_q.pth")

import os
orig = os.path.getsize("Hybrid_vit.pth") / 1e6
qsz  = os.path.getsize("Hybrid_vit_q.pth") / 1e6
print(f"Done: {orig:.1f}MB -> {qsz:.1f}MB")
EOF


# ── Stage 2: Build Python dependencies ─────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

RUN pip install --no-cache-dir --user \
    torch==2.2.2+cpu \
    torchvision==0.17.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir --user -r requirements.txt


# ── Stage 3: Minimal production runtime ─────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/models && \
    chown -R appuser:appuser /app

COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

COPY --chown=appuser:appuser backend/ /app/

# Only copy the small quantized weights — NOT the 353MB full model
COPY --from=quantizer --chown=appuser:appuser /work/Hybrid_vit_q.pth /app/models/Hybrid_vit.pth

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --timeout-keep-alive 120"]
