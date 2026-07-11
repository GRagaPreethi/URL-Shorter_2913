# Prompts

This document records the AI prompts used in building and operating this
project — both the prompt used at runtime for AI alias suggestions, and a
summary of how the project itself was built with an AI coding agent.

## Runtime prompt: AI alias suggestions

`POST /api/links/suggest-alias` calls Google Gemini (`gemini-flash-latest`)
with the following prompt template (see
`artifacts/api-server/src/lib/aliasSuggestion.ts`):

```
Suggest exactly 3 short, catchy, URL-safe alias slugs (3-30 characters, lowercase letters/numbers/hyphens only, no spaces) for a shortened link.
Link title: "<title>"
Destination URL: "<originalUrl>"
Respond with ONLY a JSON array of 3 strings, nothing else. Example: ["launch-day", "big-reveal", "go-live"]
```

The response is parsed as JSON, each candidate is slugified and re-validated
against the same alias rules used for user-submitted custom aliases
(`isValidAlias`), and invalid candidates are dropped. If the call fails, the
model returns unparseable output, or `GEMINI_API_KEY` isn't set, the endpoint
falls back to a deterministic generator (`fallbackAliasSuggestions`) built
from the link's title and destination hostname — the caller always receives
at least one usable suggestion.

## Building this project with an AI agent

This project was built end-to-end with Replit Agent. At a high level, the
workflow was:

1. **Contract first** — asked the agent to translate the assignment's
   feature list into an OpenAPI specification before writing any backend or
   frontend code, so both sides of the app would be generated from (and
   stay in sync with) one contract.
2. **Backend implementation** — asked the agent to implement the Drizzle
   schema and Express routes directly against the generated Zod
   validators, one resource at a time (links, dashboard, analytics,
   redirect), keeping soft-delete and validation rules consistent across
   endpoints.
3. **Frontend delegated to a design-focused sub-agent** — the dashboard and
   analytics UI were built by briefing a specialized frontend sub-agent
   with the exact list of generated API hooks to use, the page routes, and
   the data shapes, without prescribing visual details — letting it make
   its own layout, color, and typography decisions on top of the real API
   contract.
4. **Structured code review** — after the first working pass, a review
   pass was run against the backend routes and schema, which surfaced two
   real issues: an unvalidated `originalUrl` redirect target
   (`javascript:`/`data:` schemes) and an analytics endpoint that ignored
   soft-deleted links. Both were fixed and re-verified before moving on.
5. **Verification loop** — every backend change was checked with
   `pnpm run typecheck`, targeted `curl` requests against the running dev
   server, and (once added) the Vitest/Supertest suite, before restarting
   the relevant workflow and screenshotting the running app.
6. **Documentation and packaging** — once the feature set was verified
   against the assignment's checklist, this documentation set, the Docker
   Compose file, and the final downloadable ZIP were generated as the last
   step, without changing any working application code.
