/**
 * Lightweight mock GeoIP lookup. A free GeoIP API would require an external
 * network call on the redirect hot path, which conflicts with the <100ms
 * redirect budget. Instead we derive a stable, deterministic "country" from
 * the IP so repeated visits from the same client show consistent analytics.
 */
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "India",
  "Brazil",
  "Canada",
  "Australia",
  "Japan",
  "France",
  "Netherlands",
];

export function lookupCountry(ipAddress: string): string {
  let hash = 0;
  for (let i = 0; i < ipAddress.length; i++) {
    hash = (hash * 31 + ipAddress.charCodeAt(i)) >>> 0;
  }
  return COUNTRIES[hash % COUNTRIES.length]!;
}
