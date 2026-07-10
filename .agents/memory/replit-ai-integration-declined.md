---
name: Replit AI integration declined fallback
description: What to do when setupReplitAIIntegrations returns awaiting_account_upgrade and the user declines
---

If `setupReplitAIIntegrations` (e.g. for Gemini/OpenAI/Anthropic) returns
`awaiting_account_upgrade` and the user declines to upgrade, do not retry the
integration setup call again in that session.

**Why:** The upgrade prompt is a one-time account-level decision; retrying just
re-shows the same blocked prompt and wastes turns.

**How to apply:** Fall back to `requestSecrets` to collect a user-supplied API key
for the provider directly (e.g. `GEMINI_API_KEY`), and build the feature so it
degrades gracefully (rule-based/deterministic fallback) if the key is never provided.
