import { slugify } from "./shortCode";

/**
 * Generates URL-safe alias suggestions from a link's title and destination.
 * This is the deterministic fallback used whenever an AI provider is not
 * configured (or fails) — callers should always get 3 usable suggestions.
 */
export function fallbackAliasSuggestions(
  title: string,
  originalUrl: string,
): string[] {
  const base = slugify(title) || "link";
  let host = "go";
  try {
    host = slugify(new URL(originalUrl).hostname.replace(/^www\./, ""));
  } catch {
    // originalUrl may not be a valid absolute URL yet; ignore.
  }

  const suggestions = new Set<string>([
    base,
    `${base}-${host}`.slice(0, 30),
    `${base}-${Math.floor(Math.random() * 900 + 100)}`,
  ]);

  return Array.from(suggestions).filter((s) => s.length >= 3);
}
