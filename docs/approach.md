# Approach

## Goal

Build an AI-assisted URL shortener dashboard (LinkSnap) covering the full
assignment scope: short link creation with optional custom alias and expiry,
enable/disable, soft delete, search + pagination, a dashboard summary, a links
table with actions, per-link click analytics (browser/OS/device/country/
referrer breakdowns plus a daily trend), a redirect endpoint, and AI-generated
alias suggestions with a safe fallback.

## Adapting the spec to this environment

The original assignment brief assumed a Docker + Prisma + Redis + Next-style
stack delivered in phases. This project runs inside a Replit pnpm monorepo
that already has a working, contract-first stack (Express + Drizzle/Postgres
backend, React + Vite frontend, OpenAPI-driven codegen for API types and
React Query hooks). Rather than bolt on a second, parallel stack, the
assignment was re-implemented on top of the existing conventions:

- **Prisma → Drizzle ORM.** Same relational modeling goals (typed schema,
  migrations), different ORM already wired into the workspace's database
  package (`lib/db`).
- **Redis → Postgres only.** There is no caching requirement essential to
  correctness here (click counts and aggregates are cheap to query directly
  at this scale), so Redis was dropped rather than run as an unused
  dependency.
- **Docker Compose → native pnpm workflows in development,** with a
  docker-compose file added for anyone who wants to run Postgres + the app in
  containers outside of Replit. See `docs/tradeoffs.md` and the root
  `docker-compose.yml` comments for details.
- **Phased delivery → single pass.** The phased rollout in the original brief
  was written for a multi-week engagement; here the full feature set was
  built and verified in one pass, then hardened based on a code review and
  the assignment's final checklist.

## Build order

1. Defined the API contract first in `lib/api-spec/openapi.yaml` (paths,
   request/response schemas) and generated typed API hooks/Zod validators via
   Orval — this is the workspace's standard "contract-first" pattern and kept
   the frontend and backend in sync throughout.
2. Modeled the database: a `links` table (identity, destination, short code,
   custom alias, active flag, expiry, soft-delete timestamp, click count,
   timestamps) and a `clicks` table (one row per redirect, with parsed
   browser/OS/device, a derived country, referrer, and IP).
3. Implemented the Express routes for links CRUD, status toggling, soft
   delete, search + pagination, dashboard summary, analytics aggregation, the
   redirect handler, and alias suggestions.
4. Built the React dashboard and analytics pages against the generated hooks.
5. Added a deterministic outcome to every AI-dependent code path: alias
   suggestions call Gemini when `GEMINI_API_KEY` is present and fall back to
   a rule-based generator on any failure or when the key is absent, so the
   app is always fully functional without external dependencies.
6. Added backend unit and API tests, then ran a structured code review pass
   that surfaced (and led to fixing) a redirect-target validation gap and a
   soft-delete inconsistency in the analytics endpoint.
7. Wrote the documentation set (this file, `architecture.md`,
   `tradeoffs.md`, `prompts.md`) and expanded the README to cover the full
   assignment deliverable list.
