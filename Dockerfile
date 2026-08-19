# =============================================================================
# DeepVision Backend — Root Dockerfile (context = repo root)
# Used by Render with Root Directory = . (repo root)
#
# Free tier strategy:
#   - Downloads Hybrid_vit.pth (353MB) from Hugging Face at BUILD time
#   - Baked into the image — no runtime download, no cold-start OOM
#   - model.py applies dynamic INT8 quantization at first load (~280MB peak RAM)
# =============================================================================

# ── Stage 1: Download model weights ────────────────────────────────────────
FROM python:3.11-slim AS downloader

WORKDIR /weights

RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Download model at build time — baked into image, never downloaded at runtime.
RUN curl -L --retry 5 --retry-delay 10 --connect-timeout 30 --max-time 600 \
    -H "User-Agent: DeepVision-Docker/1.0" \
    -o Hybrid_vit.pth \
    "https://huggingface.co/Dinesh-18-AIML/deepvision-hybrid-vit/resolve/main/Hybrid_vit.pth" && \
    echo "Downloaded $(du -sh Hybrid_vit.pth)"


# ── Stage 2: Build Python dependencies ─────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

# CPU-only PyTorch (~180MB). Must install before other deps to prevent pip
# from pulling the 800MB CUDA build off PyPI.
RUN pip install --no-cache-dir --user \
    torch==2.2.2+cpu \
    torchvision==0.17.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir --user -r requirements.txt


# ── Stage 3: Production runtime ─────────────────────────────────────────────
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
ENV MALLOC_TRIM_THRESHOLD_=100000

COPY --chown=appuser:appuser backend/ /app/

# Model weights baked in from the downloader stage
COPY --from=downloader --chown=appuser:appuser /weights/Hybrid_vit.pth /app/models/Hybrid_vit.pth

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --timeout-keep-alive 120"]
