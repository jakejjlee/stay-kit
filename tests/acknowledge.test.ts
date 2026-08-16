import { describe, expect, it } from "vitest";
import { zonedDateStamp, validateAcknowledgment } from "../src/lib/acknowledge";

const good = {
  names: "  Susan Berman  ",
  unit: "201",
  email: "susan@example.com",
  startDate: "2027-01-28",
  signature: "Susan Berman",
  accepted: true,
};

describe("validateAcknowledgment", () => {
  it("accepts a complete submission and trims whitespace", () => {
    const r = validateAcknowledgment(good);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.names).toBe("Susan Berman");
  });

  it("rejects an empty name", () => {
    const r = validateAcknowledgment({ ...good, names: "   " });
    expect(r).toMatchObject({ ok: false, field: "names" });
  });

  it("rejects an unticked confirmation", () => {
    const r = validateAcknowledgment({ ...good, accepted: false });
    expect(r).toMatchObject({ ok: false, field: "accepted" });
  });

  it("rejects a malformed email", () => {
    const r = validateAcknowledgment({ ...good, email: "susan@example" });
    expect(r).toMatchObject({ ok: false, field: "email" });
  });

  it("rejects a signature that does not match the typed names", () => {
    const r = validateAcknowledgment({ ...good, signature: "S B" });
    expect(r).toMatchObject({ ok: false, field: "signature" });
  });

  it("accepts a signature that differs only in case and spacing", () => {
    const r = validateAcknowledgment({ ...good, signature: "susan   berman" });
    expect(r.ok).toBe(true);
  });

  it("rejects a start date that is not YYYY-MM-DD", () => {
    const r = validateAcknowledgment({ ...good, startDate: "01/28/2027" });
    expect(r).toMatchObject({ ok: false, field: "startDate" });
  });

  it("treats a filled honeypot as a form-level rejection", () => {
    const r = validateAcknowledgment({ ...good, company: "spam co" });
    expect(r).toMatchObject({ ok: false, field: "form" });
  });
});

describe("zonedDateStamp", () => {
  it("uses the Naples calendar date, not the UTC one", () => {
    // 02:00 UTC on Jan 15 is still 21:00 on Jan 14 in Naples.
    expect(zonedDateStamp(new Date("2027-01-15T02:00:00Z"), "America/New_York")).toBe("2027-01-14");
  });

  it("holds through daylight saving", () => {
    // 03:00 UTC on Jul 15 is 23:00 on Jul 14 in Naples (EDT).
    expect(zonedDateStamp(new Date("2027-07-15T03:00:00Z"), "America/New_York")).toBe("2027-07-14");
  });

  it("returns the same day when the instant is mid-afternoon in Naples", () => {
    expect(zonedDateStamp(new Date("2027-01-15T19:00:00Z"), "America/New_York")).toBe("2027-01-15");
  });
});
