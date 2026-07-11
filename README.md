# LinkSnap — AI-Powered URL Shortener Dashboard

LinkSnap is a full-stack URL shortener with an analytics dashboard and
AI-assisted alias suggestions. Create trackable short links, monitor click
analytics across browser, OS, device, country, and referrer dimensions, and
manage link lifecycle with enable/disable, expiry dates, and soft delete.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Folder Structure](#folder-structure)
6. [Installation](#installation)
7. [Environment Variables](#environment-variables)
8. [Running Locally](#running-locally)
9. [Running with Docker](#running-with-docker)
10. [API Documentation](#api-documentation)
11. [Testing](#testing)
12. [Deployment](#deployment)

---

## Project Overview

LinkSnap is a production-ready URL shortener inspired by Bitly. It lets you:

- Shorten any `http`/`https` URL with an auto-generated Base62 code or a
  human-readable custom alias.
- Control link lifecycle — activate, deactivate, set an expiry date, or
  soft-delete at any time.
- Track every redirect with per-click analytics: browser, operating system,
  device type, country, and referrer.
- View a dashboard summary (total links, active links, total clicks, expired
  links) and a per-link analytics page with a daily trend chart plus four
  breakdown charts.
- Get AI-generated alias suggestions powered by Google Gemini (with an
  automatic fallback to a deterministic generator when the key is absent or
  the API is unavailable).

The project is structured as a pnpm monorepo. See [Architecture](#architecture)
for details.

---

## Features

| Feature | Status |
|---|---|
| Create Short URL | ✅ |
| Update Short URL (title, destination, expiry, alias) | ✅ |
| Custom Alias | ✅ |
| Expiry Date | ✅ |
| Enable / Disable link | ✅ |
| Soft Delete | ✅ |
| Search links | ✅ |
| Pagination | ✅ |
| Redirect (`GET /api/r/:shortCode`) | ✅ |
| Click Analytics — Browser | ✅ |
| Click Analytics — Operating System | ✅ |
| Click Analytics — Device | ✅ |
| Click Analytics — Country | ✅ |
| Click Analytics — Referrer | ✅ |
| Dashboard Statistics | ✅ |
| Analytics Charts (daily trend + 4 breakdowns) | ✅ |
| AI Alias Suggestions (Gemini + fallback) | ✅ |
| Input Validation (Zod + scheme allow-listing) | ✅ |

---

## Tech Stack

### Backend
- **Node.js 20** / **TypeScript**
- **Express 5** — HTTP server
- **Drizzle ORM** — type-safe SQL query builder + schema management
- **PostgreSQL** — primary database
- **ua-parser-js** — User-Agent parsing for click analytics
- **@google/genai** — Gemini API client for AI alias suggestions (optional)
- **pino** — structured JSON logging
- **Vitest + Supertest** — unit and API tests

### Frontend
- **React 18** / **TypeScript**
- **Vite** — dev server and bundler
- **Tailwind CSS** — utility-first styling
- **TanStack Query (React Query)** — data fetching and cache
- **Recharts** — analytics charts
- **Orval** — generated React Query hooks from the OpenAPI spec

### API contract
- **OpenAPI 3.0** — machine-readable API specification (`lib/api-spec/openapi.yaml`)
- **Orval** — codegen: produces Zod validators (used by backend) and React
  Query hooks (used by frontend) from the single spec

---

## Architecture

```
┌──────────────────────────┐
│  Frontend (React + Vite) │  artifacts/linksnap/
│  Dashboard & Analytics   │
└──────────┬───────────────┘
           │  fetch /api/...
┌──────────▼───────────────┐
│  Backend (Express 5)      │  artifacts/api-server/
│  mounted at /api          │
│  ┌─────────────────────┐  │
│  │ routes/links         │  │  CRUD, search, pagination,
│  │ routes/dashboard     │  │  enable/disable, soft delete,
│  │ routes/analytics     │  │  alias suggestions
│  │ routes/redirect      │  │  redirect + click recording
│  └─────────────────────┘  │
└──────────┬───────────────┘
           │  Drizzle ORM
┌──────────▼───────────────┐
│      PostgreSQL            │
│  tables: links, clicks     │
└───────────────────────────┘

     ┌─────────────────────┐
     │  Google Gemini       │  (optional)
     │  alias suggestions   │  falls back to rule-based
     └─────────────────────┘  generator on any failure
```

The API contract lives in `lib/api-spec/openapi.yaml`. Running the codegen
step regenerates Zod validators used by the backend and React Query hooks
used by the frontend from this single source of truth. See
[`docs/architecture.md`](docs/architecture.md) for detailed data models and
request flows.

---

## Folder Structure

```
.
├── artifacts/
│   ├── api-server/             # Express backend
│   │   ├── src/
│   │   │   ├── app.ts              # Express middleware + router mount
│   │   │   ├── index.ts            # process entrypoint
│   │   │   ├── routes/
│   │   │   │   ├── links.ts        # CRUD, alias suggestion
│   │   │   │   ├── analytics.ts    # click analytics aggregation
│   │   │   │   ├── dashboard.ts    # summary stats
│   │   │   │   ├── redirect.ts     # short link redirect
│   │   │   │   └── *.test.ts       # API tests (Supertest)
│   │   │   └── lib/
│   │   │       ├── shortCode.ts    # Base62 + alias validation
│   │   │       ├── aliasSuggestion.ts  # Gemini + fallback
│   │   │       ├── geo.ts          # mock GeoIP
│   │   │       ├── url.ts          # redirect target validation
│   │   │       └── *.test.ts       # unit tests
│   │   ├── vitest.config.ts
│   │   └── Dockerfile
│   └── linksnap/               # React + Vite frontend
│       ├── src/
│       │   ├── pages/          # Dashboard, Analytics
│       │   └── components/
│       ├── vite.config.ts
│       ├── nginx.conf          # SPA + /api proxy for Docker
│       └── Dockerfile
├── lib/
│   ├── api-spec/               # OpenAPI spec (source of truth)
│   │   └── openapi.yaml
│   ├── api-client-react/       # generated React Query hooks
│   ├── api-zod/                # generated Zod schemas
│   └── db/                     # Drizzle schema + migrations
│       └── src/schema/
│           ├── links.ts
│           └── clicks.ts
├── docs/
│   ├── approach.md             # overall approach and decisions
│   ├── architecture.md         # detailed architecture + data models
│   ├── tradeoffs.md            # deliberate tradeoffs vs. the spec
│   └── prompts.md              # AI prompts used (runtime + build-time)
├── docker-compose.yml
├── .env.example
└── README.md                   # this file
```

---

## Installation

### Prerequisites

- Node.js 20+
- pnpm 10+ (`npm install -g pnpm`)
- A running PostgreSQL instance (14+)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd linksnap

# 2. Install all workspace dependencies
pnpm install

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL at minimum (see Environment Variables below)

# 4. Push the database schema
pnpm --filter @workspace/db run push

# 5. (Optional) Regenerate API client/validators from the OpenAPI spec
#    Only needed if you modify lib/api-spec/openapi.yaml
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment Variables

Copy `.env.example` to `.env` and set the following:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/linksnap` |
| `PORT` | Yes | `8080` | Port the API server listens on |
| `BASE_PATH` | Yes (frontend) | `/` | URL base path for the Vite frontend |
| `GEMINI_API_KEY` | No | — | Google Gemini API key. When absent, alias suggestions use the deterministic fallback |
| `LOG_LEVEL` | No | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | No | `development` | Set to `production` for production builds |

---

## Running Locally

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 — API server (defaults to PORT=8080)
PORT=8080 DATABASE_URL=<your-db-url> pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (defaults to a Vite-assigned port)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/linksnap run dev
```

The frontend's dev server proxies `/api` requests to the backend, so
navigating to `http://localhost:5173` gives you the full working app.

### Useful commands

```bash
# Typecheck all packages
pnpm run typecheck

# Run backend tests
pnpm --filter @workspace/api-server run test

# Build everything
pnpm run build

# Push Drizzle schema changes to the database
pnpm --filter @workspace/db run push

# Regenerate API hooks/Zod schemas after editing the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Running with Docker

A `docker-compose.yml` is provided for running the full stack (Postgres +
backend + frontend) in containers outside of Replit.

> **Note:** Docker is not the primary development environment for this
> project (it runs natively on Replit against a managed Postgres instance).
> The Docker setup is provided for portability. See
> [`docs/tradeoffs.md`](docs/tradeoffs.md) for more context.

### Steps

```bash
# 1. Copy and configure .env
cp .env.example .env
# Optionally set GEMINI_API_KEY in .env for real AI alias suggestions

# 2. Build and start all services
docker compose up --build

# 3. Apply the database schema (first run only)
docker compose exec api-server node -e "
  // Run Drizzle push via the migrate script, or apply schema manually
  // See lib/db/README.md for migration options
"
```

Services:
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API server | http://localhost:8080/api |
| PostgreSQL | localhost:5432 |

To stop:
```bash
docker compose down
# To also remove the database volume:
docker compose down -v
```

---

## API Documentation

The full API contract is in [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml).

### Endpoints summary

#### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |

#### Dashboard
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Total links, active links, total clicks, expired count |

#### Links
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/links` | List links with search (`?search=`) and pagination (`?page=&limit=`) |
| `POST` | `/api/links` | Create a short link |
| `GET` | `/api/links/:id` | Get a single link |
| `PUT` | `/api/links/:id` | Update a link |
| `DELETE` | `/api/links/:id` | Soft-delete a link |
| `PATCH` | `/api/links/:id/status` | Enable or disable a link |
| `POST` | `/api/links/suggest-alias` | Get AI (or fallback) alias suggestions |

#### Analytics
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/analytics/:id` | Per-link click analytics: totals, daily trend, browser/device/country/referrer breakdowns |

#### Redirect
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/r/:shortCode` | Redirect to the original URL and asynchronously record click analytics. Returns `302` on success, `404` for unknown codes, `410` for disabled or expired links |

### Example: create a link

```bash
curl -X POST http://localhost:8080/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Launch",
    "originalUrl": "https://example.com/blog/launch",
    "customAlias": "launch-2026",
    "expiresAt": "2027-01-01T00:00:00.000Z"
  }'
```

### Example: get alias suggestions

```bash
curl -X POST http://localhost:8080/api/links/suggest-alias \
  -H "Content-Type: application/json" \
  -d '{"title": "Summer Sale", "originalUrl": "https://shop.example.com"}'
```

### Example: redirect

```bash
curl -L http://localhost:8080/api/r/launch-2026
```

---

## Testing

The backend has two categories of tests, all in
`artifacts/api-server/src/**/*.test.ts`:

**Unit tests** (pure functions, no database):
- `lib/shortCode.test.ts` — Base62 code generation, alias validation, slugify
- `lib/url.test.ts` — redirect-target scheme validation
- `lib/aliasSuggestion.test.ts` — deterministic fallback alias generator
- `lib/geo.test.ts` — deterministic mock GeoIP

**API tests** (Supertest against the full Express app + real Postgres):
- `routes/links.test.ts` — create, list, search, pagination, custom alias,
  duplicate alias rejection, input validation, enable/disable, soft delete,
  alias suggestions
- `routes/dashboard.test.ts` — summary totals reflect created/expired links
- `routes/analytics.test.ts` — browser/device/country/referrer aggregation,
  soft-delete exclusion
- `routes/redirect.test.ts` — redirect 302, click recording, 404 for unknown
  codes, 410 for disabled and expired links

### Run the tests

```bash
pnpm --filter @workspace/api-server run test
```

All 38 tests should pass. The API tests use a real Postgres connection
(from `DATABASE_URL`) and clean up every row they create in `afterAll` hooks.

---

## Deployment

### Deploying to Replit

Click the **Publish** button in the Replit workspace. Replit will provision
a production environment with:
- A separate Postgres database (set `DATABASE_URL` in production secrets)
- The `PORT` and `BASE_PATH` env vars injected automatically
- HTTPS and a public domain out of the box

Set `GEMINI_API_KEY` in your Replit production secrets if you want live AI
alias suggestions in production.

### Deploying elsewhere

1. Build the backend and frontend:
   ```bash
   pnpm run build
   ```
2. Deploy `artifacts/api-server/dist/index.mjs` to any Node.js 20 host
   (Railway, Render, Fly.io, AWS, etc.) with the required environment
   variables set.
3. Serve the `artifacts/linksnap/dist/public/` static files from a CDN or
   nginx, proxying `/api/*` requests to the backend.
4. Run the database schema push against your production Postgres before first
   boot:
   ```bash
   DATABASE_URL=<prod-url> pnpm --filter @workspace/db run push
   ```

### Using Docker in production

```bash
# Build production images from the repo root
docker build -f artifacts/api-server/Dockerfile -t linksnap-api:latest .
docker build -f artifacts/linksnap/Dockerfile   -t linksnap-frontend:latest .

# Or use Docker Compose
docker compose up --build -d
```

See [`docker-compose.yml`](docker-compose.yml) for the full service
configuration, including the Postgres volume and health-check setup.
