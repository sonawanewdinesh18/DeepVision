# =============================================================================
# DeepVision Frontend — Production Multi-Stage Dockerfile
# =============================================================================

# ── Stage 1: Build Frontend Bundle ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code and configuration files
COPY . .

# Build production distribution
ARG VITE_API_URL=""
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

# ── Stage 2: Serve with Nginx Reverse Proxy ──────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
