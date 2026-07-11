# Tradeoffs

This document records deliberate deviations from the original assignment
brief and the reasoning behind them, plus a few internal tradeoffs made while
implementing the feature set.

## Docker Compose is additive, not the primary dev workflow

The project runs natively on Replit via pnpm workflows against a
pre-provisioned Postgres database — that's the environment this app was
actually built and verified in. A `docker-compose.yml` has been added at the
repo root so the project can also be run outside Replit with a single
command, but it is not required for local development inside this
environment. See the README's "Running with Docker" section for exact usage.

**Why:** Replit provisions and manages Postgres directly; wrapping it in a
container inside that environment would be redundant. Docker Compose is
provided purely for portability when running the checkout elsewhere.

## Prisma → Drizzle ORM

**Why:** The workspace's shared `lib/db` package is already wired around
Drizzle (schema definitions, `drizzle-kit push`/migrations, typed query
builder). Introducing Prisma alongside it would mean two ORMs and two
migration systems in one project for no functional benefit — Drizzle covers
the same modeling and type-safety goals the assignment calls for.

## No Redis cache layer

**Why:** The assignment's Redis requirement is primarily about caching hot
reads (e.g. redirect lookups, dashboard aggregates) at scale. At the
data volumes this app is designed for, direct indexed Postgres queries
(`short_code` is a unique-indexed lookup; aggregates use `GROUP BY` on a
foreign-keyed `clicks` table) are fast enough, and adding a cache
introduces invalidation complexity (e.g. keeping cached click counts in
sync with real-time redirects) without a corresponding correctness or
latency requirement in this deployment target. If click volume grows to
where redirect-path DB load becomes a bottleneck, the redirect lookup is the
first candidate for a cache — it's a pure read keyed by `short_code`.

## Async, fire-and-forget click recording

The redirect route sends the `302` response before writing the click record
and incrementing `click_count`. **Why:** a shortener's core promise is a
fast redirect; making the visible redirect wait on an analytics write would
trade user-facing latency for data that has no need to be synchronous. The
tradeoff is a small window where a client could disconnect before the write
completes — acceptable for click analytics, since occasional undercounting
under abnormal client behavior doesn't affect the product's correctness
guarantees the way losing the link mapping would.

## Mock GeoIP instead of a real geolocation service

`lib/geo.ts` derives a deterministic "country" from a hash of the client IP
rather than calling a real GeoIP API or database. **Why:** a real lookup
would add either an external network call on the redirect hot path (hurting
the latency goal above) or a MaxMind-style local database dependency this
environment doesn't provision. The mock is deterministic (same IP always
maps to the same country) so analytics still look consistent per-visitor;
swapping in a real provider later is a one-file change behind the same
`lookupCountry(ipAddress)` interface.

## AI alias suggestions with a mandatory fallback

`POST /api/links/suggest-alias` calls Gemini when `GEMINI_API_KEY` is
configured, but every failure mode (missing key, network error, malformed
model output, invalid suggested slugs) falls through to a deterministic,
rule-based generator (`fallbackAliasSuggestions`) derived from the link's
title and destination host. **Why:** the assignment explicitly calls for a
fallback if the AI call fails, and a user-facing "create link" flow should
never hard-fail because a third-party AI provider is unavailable or
misconfigured.

## Redirect path lives under `/api/r/:shortCode`, not a bare root path

Real link shorteners typically serve redirects from a bare short domain
(`bit.ly/abc123`). This project runs inside Replit's path-based artifact
routing, where each artifact owns a URL prefix rather than a whole domain —
there is no way to claim an un-prefixed root route for the backend without
colliding with the frontend artifact mounted at `/`. **Why:** `/api/r/:code`
keeps the redirect on the same backend service and base path as the rest of
the API rather than requiring a second, separately-routed service purely to
serve bare-path redirects.

## `originalUrl` validated in application code, not via OpenAPI `format: uri`

Using `format: uri` in the OpenAPI schema broke the generated Zod schema in
this workspace's Orval version (it emitted a `zod.string().url` call that
doesn't exist on the resolved Zod build). **Why:** rather than pin/patch the
codegen toolchain, `originalUrl` is validated in the route handler via
`isSafeRedirectUrl()` (allow-listing `http`/`https` schemes), which is both
simpler and gives full control over the error message returned to the
client.
