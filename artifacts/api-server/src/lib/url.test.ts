import { describe, it, expect } from "vitest";
import { isSafeRedirectUrl } from "./url";

describe("isSafeRedirectUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isSafeRedirectUrl("https://example.com")).toBe(true);
    expect(isSafeRedirectUrl("http://example.com/path?query=1")).toBe(true);
  });

  it("rejects dangerous schemes", () => {
    expect(isSafeRedirectUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectUrl("data:text/html,<script>alert(1)</script>")).toBe(
      false,
    );
    expect(isSafeRedirectUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isSafeRedirectUrl("not a url")).toBe(false);
    expect(isSafeRedirectUrl("")).toBe(false);
  });
});
