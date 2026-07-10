import { GoogleGenAI } from "@google/genai";
import { slugify, isValidAlias } from "./shortCode";

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

let genAI: GoogleGenAI | null | undefined;

function getGenAI(): GoogleGenAI | null {
  if (genAI !== undefined) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;
  return genAI;
}

async function aiAliasSuggestions(
  title: string,
  originalUrl: string,
): Promise<string[] | null> {
  const client = getGenAI();
  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Suggest exactly 3 short, catchy, URL-safe alias slugs (3-30 characters, lowercase letters/numbers/hyphens only, no spaces) for a shortened link.
Link title: "${title}"
Destination URL: "${originalUrl}"
Respond with ONLY a JSON array of 3 strings, nothing else. Example: ["launch-day", "big-reveal", "go-live"]`,
    });

    const text = response.text?.trim() ?? "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return null;

    const suggestions = parsed
      .filter((s): s is string => typeof s === "string")
      .map((s) => slugify(s))
      .filter((s) => isValidAlias(s));

    return suggestions.length > 0 ? suggestions.slice(0, 3) : null;
  } catch {
    return null;
  }
}

/**
 * Returns AI-generated alias suggestions when GEMINI_API_KEY is configured
 * and the call succeeds, otherwise falls back to the deterministic generator
 * so the endpoint always returns usable suggestions.
 */
export async function suggestAliases(
  title: string,
  originalUrl: string,
): Promise<string[]> {
  const aiSuggestions = await aiAliasSuggestions(title, originalUrl);
  return aiSuggestions ?? fallbackAliasSuggestions(title, originalUrl);
}
