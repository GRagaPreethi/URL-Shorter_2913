/**
 * Restricts short link destinations to http/https absolute URLs. Prevents
 * storing/redirecting to dangerous schemes such as javascript: or data:.
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
