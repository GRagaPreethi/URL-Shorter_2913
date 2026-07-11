# ──────────────────────────────────────────────────────────────────────────────
# LinkSnap – API Server
# Multi-stage build for the Express backend.
#
# Build context must be the REPO ROOT so the workspace packages (lib/db,
# lib/api-zod, etc.) are available during install and compile.
#
# Usage (from repo root):
#   docker build -f artifacts/api-server/Dockerfile -t linksnap-api .
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy manifests first so layer caching reuses the install when only src changes
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# Workspace package manifests
COPY lib/db/package.json            lib/db/
COPY lib/api-spec/package.json      lib/api-spec/
COPY lib/api-zod/package.json       lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY artifacts/api-server/package.json artifacts/api-server/

# Install all deps (needed for cross-package references)
RUN pnpm install --frozen-lockfile

# Copy the full source
COPY lib/       lib/
COPY artifacts/api-server/ artifacts/api-server/

# Build the TypeScript libs that api-server depends on, then api-server itself
RUN pnpm --filter @workspace/db run build 2>/dev/null || true
RUN pnpm --filter @workspace/api-zod run build 2>/dev/null || true
RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the bundled output (esbuild bundles most deps; only native/optional ones
# like @google/genai are left external and need to be installed at runtime)
COPY --from=builder /workspace/artifacts/api-server/dist ./dist

# Install only the externalized runtime package(s) – keeps the image small
RUN npm install --omit=dev @google/genai 2>/dev/null; true

# Schema push happens via a separate migration step (see docker-compose.yml);
# copy the Drizzle config + schema for the optional migration entrypoint
COPY --from=builder /workspace/lib/db        /workspace/lib/db
COPY --from=builder /workspace/node_modules  /workspace/node_modules

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "/app/dist/index.mjs"]
