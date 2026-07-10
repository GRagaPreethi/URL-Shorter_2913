---
name: Orval/Zod format:uri codegen bug
description: OpenAPI string fields with format:uri break typecheck in this workspace's Orval+Zod codegen setup
---

Adding `format: uri` to a `type: string` OpenAPI schema property causes Orval's Zod
generator to emit `zod.string().url` (or `.url()`), which does not exist on the
resolved Zod version in this workspace, breaking `pnpm run typecheck:libs`.

**Why:** Discovered while building a URL shortener — `originalUrl: { type: string, format: uri }`
compiled fine via orval's TS client generator but the parallel Zod schema generator
produced invalid code.

**How to apply:** Keep such fields as plain `{ type: string, minLength: 1 }` in the
OpenAPI spec and enforce URL/format validation in application code (e.g. a small
`new URL(value)` check with an allowed-protocol list) instead of relying on the
generated Zod schema.
