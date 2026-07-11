import { describe, it, expect } from "vitest";
import { lookupCountry } from "./geo";

describe("lookupCountry", () => {
  it("is deterministic for the same IP address", () => {
    expect(lookupCountry("203.0.113.10")).toBe(lookupCountry("203.0.113.10"));
  });

  it("returns a non-empty country name", () => {
    expect(lookupCountry("198.51.100.24").length).toBeGreaterThan(0);
  });

  it("can return different values for different IPs", () => {
    const results = new Set(
      ["1.1.1.1", "8.8.8.8", "203.0.113.5", "9.9.9.9", "10.0.0.1"].map(
        lookupCountry,
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });
});
