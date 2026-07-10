const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generates a random Base62 string of the given length. Uniqueness against
 * existing short codes must be checked by the caller (see generateUniqueShortCode).
 */
export function generateBase62Code(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += BASE62_ALPHABET[Math.floor(Math.random() * BASE62_ALPHABET.length)];
  }
  return code;
}

const ALIAS_SLUG_PATTERN = /^[a-zA-Z0-9-_]+$/;

export function isValidAlias(alias: string): boolean {
  return (
    alias.length >= 3 && alias.length <= 40 && ALIAS_SLUG_PATTERN.test(alias)
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 30);
}
