# LinkSnap

An AI-assisted URL shortener dashboard: create trackable short links, monitor click analytics, and manage link lifecycle (enable/disable, expiry, soft delete).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/linksnap run dev` — run the LinkSnap web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (mounted at `/api`)
- DB: PostgreSQL + Drizzle ORM (`links`, `clicks` tables)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) → `@workspace/api-client-react` hooks
- Frontend: React + Vite (`artifacts/linksnap`), previewPath `/`
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract (links, analytics, dashboard, alias suggestion)
- `lib/db/src/schema/links.ts`, `clicks.ts` — DB schema
- `artifacts/api-server/src/routes/` — `links.ts` (CRUD, status, alias suggestion), `analytics.ts`, `dashboard.ts`, `redirect.ts` (short-link redirect + async click recording)
- `artifacts/api-server/src/lib/` — `shortCode.ts` (Base62 generation + alias validation), `aliasSuggestion.ts` (fallback alias suggestions), `geo.ts` (deterministic mock GeoIP), `url.ts` (redirect target validation)
- `artifacts/linksnap/src/` — dashboard + analytics pages, wired to generated Orval hooks

## Architecture decisions

- Redirect endpoint lives at `/api/r/:shortCode` (not a bare root path) because this platform routes artifacts by path prefix — there's no true root-level shortlink like a real Bitly domain.
- Click recording happens asynchronously after the redirect response is sent, so analytics writes never add latency to the redirect itself.
- No Redis/Docker: caching and click aggregation go straight through Postgres since this environment doesn't provision those.
- GeoIP is a deterministic hash-based mock (no external API call on the redirect hot path) — same IP always maps to the same "country" for consistent-looking analytics, not real geolocation.
- Alias suggestions currently use a deterministic rule-based fallback (slugified title/host/random suffix). Real AI suggestions require a user-supplied Gemini API key (the managed Replit AI integration needs an account upgrade the user declined).
- `originalUrl` is validated server-side to `http`/`https` schemes only (not enforced via OpenAPI `format: uri`, which broke Zod codegen) — this blocks `javascript:`/`data:` redirect targets.

## Product

- Dashboard: summary stats (total/active/expired links, total clicks) and a searchable, paginated links table with copy/edit/enable-disable/delete/analytics actions.
- Create/edit link modal: title, destination URL, optional custom alias (with AI/fallback suggestions), optional expiry.
- Per-link analytics page: total clicks, daily click trend, browser/device/country breakdowns, top referrers.
- Short-link redirect with soft-deleted/disabled/expired link handling (404/410 responses).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Don't use OpenAPI `format: uri` on string fields — the installed Orval/Zod codegen setup emits `zod.string().url` which doesn't exist on the resolved Zod version and breaks `typecheck:libs`. Validate URL format in application code instead.
- After editing `lib/api-spec/openapi.yaml`, always rerun `pnpm --filter @workspace/api-spec run codegen` before restarting dependent workflows, or the frontend/backend will be working against stale generated types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
