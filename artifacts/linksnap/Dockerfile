# ──────────────────────────────────────────────────────────────────────────────
# LinkSnap – Frontend (React + Vite)
# Multi-stage build: Vite compiles to static files, nginx serves them.
#
# Build context must be the REPO ROOT so workspace packages are available.
#
# Usage (from repo root):
#   docker build -f artifacts/linksnap/Dockerfile -t linksnap-frontend .
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

COPY lib/db/package.json               lib/db/
COPY lib/api-spec/package.json         lib/api-spec/
COPY lib/api-zod/package.json          lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY artifacts/linksnap/package.json   artifacts/linksnap/

RUN pnpm install --frozen-lockfile

# Full source
COPY lib/       lib/
COPY artifacts/linksnap/ artifacts/linksnap/

# Build lib packages the frontend depends on
RUN pnpm --filter @workspace/api-zod run build 2>/dev/null || true
RUN pnpm --filter @workspace/api-client-react run build 2>/dev/null || true

# Vite build — NODE_ENV=production disables all Replit-specific dev plugins
# BASE_PATH and PORT are required by vite.config.ts even at build time
RUN PORT=5173 BASE_PATH=/ NODE_ENV=production \
    pnpm --filter @workspace/linksnap run build

# ── Stage 2: runtime (nginx) ──────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets
COPY --from=builder /workspace/artifacts/linksnap/dist/public /usr/share/nginx/html

# nginx config: serve SPA (all routes → index.html) and proxy /api to backend
COPY artifacts/linksnap/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
