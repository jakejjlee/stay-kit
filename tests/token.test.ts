import { describe, expect, it } from "vitest";
import { newToken, isValidToken } from "../src/lib/token";

describe("arrival tokens", () => {
  it("is long enough to be unguessable", () => {
    expect(newToken().length).toBeGreaterThanOrEqual(43);
  });

  it("is url safe", () => {
    expect(newToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("never repeats across a thousand draws", () => {
    expect(new Set(Array.from({ length: 1000 }, () => newToken())).size).toBe(1000);
  });

  it("rejects a short or malformed token", () => {
    expect(isValidToken("abc")).toBe(false);
    expect(isValidToken("../../etc/passwd")).toBe(false);
    expect(isValidToken(newToken())).toBe(true);
  });
});
