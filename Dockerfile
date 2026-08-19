# =============================================================================
# DeepVision Backend — Root Dockerfile for Render Deployments
# =============================================================================

# ── Stage 1: Build Dependencies ───────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# ── Stage 2: Production Runtime ──────────────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/models && \
    chown -R appuser:appuser /app

COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV MALLOC_TRIM_THRESHOLD_=100000
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

# Copy backend source code to /app
COPY --chown=appuser:appuser backend/ /app/

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --timeout-keep-alive 60"]
