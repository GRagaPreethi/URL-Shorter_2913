# LinkSnap

An AI-assisted URL shortener dashboard: create trackable short links, monitor
click analytics, and manage link lifecycle (enable/disable, expiry, soft delete).

This project is a pnpm monorepo (not a Docker/Prisma stack) containing:

- `artifacts/api-server` — Express 5 backend (mounted at `/api`)
- `artifacts/linksnap` — React + Vite frontend dashboard
- `lib/db` — Drizzle ORM schema and migrations (Postgres)
- `lib/api-spec` — OpenAPI specification (source of truth for the API contract)
- `lib/api-client-react`, `lib/api-zod` — generated API hooks and Zod schemas (via Orval)

## Prerequisites

- Node.js 20+
- pnpm 10+
- A PostgreSQL database

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env
# edit .env and set DATABASE_URL (and optionally GEMINI_API_KEY)

# 3. Push the database schema
pnpm --filter @workspace/db run push

# 4. (Optional) regenerate API client/types from the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

## Running locally

Run the backend and frontend in separate terminals:

```bash
# Backend (defaults to PORT=8080)
pnpm --filter @workspace/api-server run dev

# Frontend
pnpm --filter @workspace/linksnap run dev
```

The frontend expects the API to be reachable under its own `BASE_URL + api/...`
prefix — see `artifacts/linksnap/vite.config.ts` for how the dev proxy/base path
is configured.

## Environment variables

See `.env.example`:

- `DATABASE_URL` — Postgres connection string (required)
- `PORT` — API server port
- `GEMINI_API_KEY` — optional; enables real AI-generated alias suggestions.
  Without it, alias suggestions fall back to a deterministic generator.
- `BASE_PATH`, `LOG_LEVEL`, `NODE_ENV` — optional tuning

## Useful commands

- `pnpm run typecheck` — typecheck all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/Zod schemas from `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — push Drizzle schema changes to the database

## API overview

Key endpoints (see `lib/api-spec/openapi.yaml` for the full contract):

- `GET /api/dashboard/summary` — link/click totals
- `GET /api/links`, `POST /api/links`, `GET/PUT/DELETE /api/links/:id`
- `PATCH /api/links/:id/status` — enable/disable a link
- `POST /api/links/suggest-alias` — AI (or fallback) alias suggestions
- `GET /api/analytics/:id` — per-link click analytics
- `GET /api/r/:shortCode` — short link redirect (records click analytics asynchronously)

More architecture notes and gotchas are in `replit.md`.
