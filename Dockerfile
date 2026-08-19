# =============================================================================
# DeepVision Backend — Root Dockerfile (context = repo root)
# Used when Render Root Directory is set to . (repo root)
# =============================================================================

# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

# Install CPU-only PyTorch first (small ~180MB wheel, avoids pulling 800MB CUDA build)
RUN pip install --no-cache-dir --user \
    torch==2.2.2+cpu \
    torchvision==0.17.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install all other dependencies
RUN pip install --no-cache-dir --user \
    fastapi>=0.111.0 \
    uvicorn[standard]>=0.29.0 \
    python-multipart>=0.0.9 \
    pydantic>=2.7.0 \
    pydantic-settings>=2.3.0 \
    email-validator>=2.1.0 \
    python-dotenv>=1.0.1 \
    supabase>=2.4.0 \
    python-jose[cryptography]>=3.3.0 \
    httpx>=0.27.0 \
    Pillow>=10.3.0 \
    "opencv-python-headless>=4.8.0,<4.11.0" \
    numpy>=1.26.0 \
    typing-extensions>=4.11.0


# ── Stage 2: Production Runtime ─────────────────────────────────────────────
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

# Copy backend source code
COPY --chown=appuser:appuser backend/ /app/

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --timeout-keep-alive 75"]
