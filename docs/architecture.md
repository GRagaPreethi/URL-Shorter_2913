# Architecture

## High-level overview

```
                     ┌─────────────────────────┐
                     │        Browser           │
                     └────────────┬─────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │  Frontend (React + Vite)  │
                     │  artifacts/linksnap       │
                     │  - Dashboard page         │
                     │  - Analytics page         │
                     │  - Orval-generated hooks  │
                     └────────────┬─────────────┘
                                  │  fetch (BASE_URL + "api/...")
                     ┌────────────▼─────────────┐
                     │  Backend (Express 5)      │
                     │  artifacts/api-server     │
                     │  mounted at /api          │
                     │  - links routes           │
                     │  - analytics routes       │
                     │  - dashboard route        │
                     │  - redirect route         │
                     └────────────┬─────────────┘
                                  │  Drizzle ORM
                     ┌────────────▼─────────────┐
                     │      PostgreSQL           │
                     │  tables: links, clicks    │
                     └───────────────────────────┘

           ┌──────────────────────────────┐
           │  Google Gemini (optional)     │
           │  used only by                 │
           │  POST /api/links/suggest-alias│
           │  falls back to a rule-based   │
           │  generator on any failure     │
           └──────────────────────────────┘
```

## Folder structure

```
.
├── artifacts/
│   ├── api-server/        # Express backend
│   │   └── src/
│   │       ├── app.ts           # Express app wiring (middleware, router mount)
│   │       ├── index.ts         # process entrypoint (listens on PORT)
│   │       ├── routes/           # one file per resource
│   │       │   ├── links.ts          # CRUD, status, alias suggestion
│   │       │   ├── analytics.ts      # per-link analytics aggregation
│   │       │   ├── dashboard.ts      # summary stats
│   │       │   ├── redirect.ts       # short link redirect + click recording
│   │       │   └── *.test.ts         # API tests (supertest against `app`)
│   │       └── lib/
│   │           ├── shortCode.ts      # Base62 generator + alias validation
│   │           ├── aliasSuggestion.ts# Gemini call + deterministic fallback
│   │           ├── geo.ts            # deterministic mock GeoIP lookup
│   │           ├── url.ts            # redirect-target scheme validation
│   │           └── *.test.ts         # unit tests
│   └── linksnap/          # React + Vite frontend
│       └── src/
│           ├── pages/            # dashboard, analytics
│           └── ...
├── lib/
│   ├── api-spec/           # OpenAPI specification (source of truth)
│   ├── api-client-react/   # generated React Query hooks (Orval)
│   ├── api-zod/            # generated Zod request/response schemas (Orval)
│   └── db/                 # Drizzle schema + migrations
│       └── src/schema/
│           ├── links.ts
│           └── clicks.ts
├── docs/                   # this documentation set
├── docker-compose.yml
├── .env.example
└── README.md
```

## Data model

**`links`**

| column        | type      | notes                                    |
|---------------|-----------|-------------------------------------------|
| id            | serial PK |                                            |
| title         | text      | required                                  |
| original_url  | text      | validated to http(s) only                 |
| short_code    | text      | unique; either generated or a custom alias|
| custom_alias  | text      | nullable; the user-chosen alias, if any   |
| is_active     | boolean   | default true; enable/disable toggle       |
| expires_at    | timestamp | nullable                                  |
| deleted_at    | timestamp | nullable; soft delete marker              |
| click_count   | integer   | denormalized counter, updated on redirect |
| created_at / updated_at | timestamp | audit columns |

**`clicks`**

| column            | type      | notes                              |
|-------------------|-----------|-------------------------------------|
| id                | serial PK |                                      |
| link_id           | FK → links.id |                                  |
| clicked_at        | timestamp |                                      |
| browser           | text      | parsed from User-Agent              |
| operating_system  | text      | parsed from User-Agent              |
| device            | text      | parsed from User-Agent              |
| country           | text      | derived (see Tradeoffs — mock GeoIP)|
| referrer          | text      | from the `Referer` header, or "Direct" |
| ip_address        | text      | used only to derive `country`       |

## Request flow: short link creation

1. `POST /api/links` validates the body against the generated Zod schema
   (`CreateLinkBody`).
2. `originalUrl` is checked against an allow-list of `http`/`https` schemes
   (`lib/url.ts`) to block `javascript:`/`data:` payloads.
3. If `customAlias` is provided, it is validated for length/charset and
   checked for a collision (`409` on conflict); otherwise a unique Base62
   code is generated with retry-on-collision.
4. The row is inserted and returned as the API's `Link` shape.

## Request flow: redirect + click recording

1. `GET /api/r/:shortCode` looks up the link by short code, filtering out
   soft-deleted rows.
2. Disabled (`isActive: false`) or expired links return `410 Gone`; unknown
   codes return `404`.
3. The `302` redirect is sent **immediately** — click recording happens in a
   fire-and-forget `async` block afterward so redirect latency is never
   coupled to analytics writes (see `docs/tradeoffs.md`).
4. The click write increments `links.click_count` and inserts a `clicks` row
   with UA-parsed browser/OS/device, a derived country, and the referrer.

## Request flow: analytics

`GET /api/analytics/:id` re-validates the link exists and is not
soft-deleted, then runs grouped-count queries against `clicks` for browser,
device, country, and referrer, plus a day-bucketed count for the click trend
chart. All four breakdowns and the trend line are computed directly from
Postgres with `GROUP BY`/`count(*)` — no separate aggregation store.

## Contract-first API workflow

`lib/api-spec/openapi.yaml` is the single source of truth for every endpoint,
request body, and response shape. Running the codegen step
(`pnpm --filter @workspace/api-spec run codegen`) regenerates:

- `lib/api-client-react` — typed React Query hooks used directly by the
  frontend (e.g. `useListLinks`, `useCreateLink`, `useGetLinkAnalytics`).
- `lib/api-zod` — Zod schemas used by the backend routes to validate
  request bodies/params and to shape responses (`CreateLinkBody.safeParse(...)`,
  `ListLinksResponse.parse(...)`, etc.).

This keeps the frontend, backend validation, and API documentation from
drifting out of sync as the contract evolves.
