import { describe, it, expect } from "vitest";
import { fallbackAliasSuggestions } from "./aliasSuggestion";

describe("fallbackAliasSuggestions", () => {
  it("returns at least one URL-safe suggestion derived from the title", () => {
    const suggestions = fallbackAliasSuggestions(
      "Product Launch Announcement",
      "https://example.com/blog/launch",
    );
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(s).toMatch(/^[a-z0-9-]+$/);
      expect(s.length).toBeGreaterThanOrEqual(3);
    }
    expect(suggestions[0]).toBe("product-launch-announcement");
  });

  it("falls back to a generic base when the title has no usable characters", () => {
    const suggestions = fallbackAliasSuggestions("!!!", "https://example.com");
    expect(suggestions[0]).toBe("link");
  });

  it("degrades gracefully when originalUrl is not a valid absolute URL", () => {
    const suggestions = fallbackAliasSuggestions("My Title", "not-a-url");
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("returns unique suggestions", () => {
    const suggestions = fallbackAliasSuggestions(
      "Summer Sale",
      "https://shop.example.com",
    );
    expect(new Set(suggestions).size).toBe(suggestions.length);
  });
});
