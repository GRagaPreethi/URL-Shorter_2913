import { describe, it, expect } from "vitest";
import { generateBase62Code, isValidAlias, slugify } from "./shortCode";

describe("generateBase62Code", () => {
  it("generates a code of the requested length using only base62 characters", () => {
    const code = generateBase62Code(7);
    expect(code).toHaveLength(7);
    expect(code).toMatch(/^[0-9A-Za-z]+$/);
  });

  it("generates different codes across calls (extremely unlikely to collide)", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateBase62Code()));
    expect(codes.size).toBeGreaterThan(45);
  });
});

describe("isValidAlias", () => {
  it("accepts aliases within length bounds using letters, numbers, hyphens, underscores", () => {
    expect(isValidAlias("my-link_1")).toBe(true);
    expect(isValidAlias("abc")).toBe(true);
  });

  it("rejects aliases that are too short", () => {
    expect(isValidAlias("ab")).toBe(false);
  });

  it("rejects aliases that are too long", () => {
    expect(isValidAlias("a".repeat(41))).toBe(false);
  });

  it("rejects aliases with invalid characters", () => {
    expect(isValidAlias("bad alias")).toBe(false);
    expect(isValidAlias("bad/alias")).toBe(false);
    expect(isValidAlias("bad.alias")).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugify("Product Launch Announcement")).toBe(
      "product-launch-announcement",
    );
  });

  it("strips special characters", () => {
    expect(slugify("50% Off! Summer Sale?!")).toBe("50-off-summer-sale");
  });

  it("truncates to 30 characters", () => {
    const long = "a".repeat(50);
    expect(slugify(long).length).toBeLessThanOrEqual(30);
  });
});
