# =============================================================================
# DeepVision Backend — Production Dockerfile
# Optimized for Cloud Container Runtime (Render / Railway / Fly / Cloud Run)
# - Bakes pre-quantized Hybrid_vit_int8.pth (192MB) at build time
# - Zero runtime model download latency
# - Runtime RAM ~140MB (fits comfortably in 512MB free tier)
# - Binds dynamically to $PORT (default 10000)
# =============================================================================

# ── Stage 1: Download pre-quantized weights at build time ────────────────────
FROM python:3.11-slim AS model_fetcher

WORKDIR /models

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L --retry 5 --retry-delay 10 --connect-timeout 60 --max-time 600 \
    -H "User-Agent: DeepVision-Docker/1.0" \
    -o Hybrid_vit_int8.pth \
    "https://huggingface.co/Dinesh-18-AIML/deepvision-hybrid-vit/resolve/main/Hybrid_vit_int8.pth" \
    && echo "Bake model size: $(du -sh Hybrid_vit_int8.pth)"


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
    "numpy>=1.26.0,<2.0.0" \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir --user -r requirements.txt


# ── Stage 3: Minimal production runtime ─────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl ca-certificates \
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

# Bake pre-downloaded weights directly into the container image
COPY --from=model_fetcher --chown=appuser:appuser /models/Hybrid_vit_int8.pth /app/models/Hybrid_vit_int8.pth

USER appuser

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1 --timeout-keep-alive 120"]
