import { describe, expect, it } from "vitest";
import { holdConfigured, holdKey, placeHold } from "../src/lib/hold";

describe("holds", () => {
  it("reports unconfigured when the credentials are absent", () => {
    expect(holdConfigured({})).toBe(false);
    expect(holdConfigured({ UPSTASH_REDIS_REST_URL: "https://x" })).toBe(false);
  });

  it("reports configured only when both credentials are present", () => {
    expect(holdConfigured({ UPSTASH_REDIS_REST_URL: "https://x", UPSTASH_REDIS_REST_TOKEN: "t" })).toBe(true);
  });

  it("namespaces a key by property and unit", () => {
    expect(holdKey("lincoln", "unit-2")).toBe("hold:lincoln:unit-2");
  });

  it("refuses rather than pretending when it is not configured", async () => {
    const r = await placeHold({}, "lincoln", "unit-2", "a@b.com");
    expect(r).toEqual({ ok: false, reason: "Holds are not configured on this site." });
  });
});
