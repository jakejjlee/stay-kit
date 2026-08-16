import { describe, expect, it } from "vitest";
import { UNKNOWN, secret, revealSecret, isSecret } from "../src/content/types";

describe("the unknown sentinel", () => {
  it("is distinguishable from any string", () => {
    expect(UNKNOWN).not.toBe("");
    expect(typeof UNKNOWN).toBe("symbol");
  });
});

describe("secrets", () => {
  it("wraps a value so it is not a bare string", () => {
    const s = secret("0516");
    expect(typeof s).toBe("object");
    expect(s as unknown as string).not.toBe("0516");
  });

  it("does not leak the value through string coercion", () => {
    const s = secret("0516");
    expect(String(s)).not.toContain("0516");
    expect(`${s}`).not.toContain("0516");
    expect(JSON.stringify({ s })).not.toContain("0516");
  });

  it("does not leak the value through a spread or Object.keys", () => {
    const s = secret("0516");
    expect(JSON.stringify({ ...s })).not.toContain("0516");
    expect(Object.keys(s)).not.toContain("__read");
  });

  it("reveals only through revealSecret", () => {
    expect(revealSecret(secret("0516"))).toBe("0516");
  });

  it("recognises its own boxes and rejects anything else", () => {
    expect(isSecret(secret("x"))).toBe(true);
    expect(isSecret("x")).toBe(false);
    expect(isSecret({ value: "x" })).toBe(false);
    expect(isSecret(null)).toBe(false);
    expect(isSecret(undefined)).toBe(false);
  });
});
