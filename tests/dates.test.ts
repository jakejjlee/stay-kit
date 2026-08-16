import { describe, expect, it } from "vitest";
import { zonedDateStamp, earliestStart, formatDate } from "../src/lib/dates";

describe("zonedDateStamp", () => {
  it("uses the property's calendar date, not the UTC one", () => {
    // 02:00 UTC on Jan 15 is still 21:00 on Jan 14 in Naples.
    expect(zonedDateStamp(new Date("2027-01-15T02:00:00Z"), "America/New_York")).toBe("2027-01-14");
  });

  it("holds through daylight saving", () => {
    expect(zonedDateStamp(new Date("2027-07-15T03:00:00Z"), "America/New_York")).toBe("2027-07-14");
  });

  it("holds east of UTC as well", () => {
    expect(zonedDateStamp(new Date("2027-01-14T22:00:00Z"), "Europe/Berlin")).toBe("2027-01-14");
    expect(zonedDateStamp(new Date("2027-01-14T23:30:00Z"), "Europe/Berlin")).toBe("2027-01-15");
  });
});

describe("earliestStart", () => {
  it("adds the approval lead time to today in the property's zone", () => {
    expect(earliestStart(new Date("2026-08-16T18:00:00Z"), 20, "America/New_York")).toBe("2026-09-05");
  });

  it("returns today when there is no lead time", () => {
    expect(earliestStart(new Date("2026-08-16T18:00:00Z"), 0, "America/New_York")).toBe("2026-08-16");
  });

  it("crosses a month boundary correctly", () => {
    expect(earliestStart(new Date("2026-08-30T12:00:00Z"), 20, "America/New_York")).toBe("2026-09-19");
  });

  it("uses the zoned day, so a late-evening visitor does not get tomorrow's runway", () => {
    // 02:00 UTC on the 17th is 22:00 on the 16th in Naples, so the runway
    // starts from the 16th, not the 17th.
    expect(earliestStart(new Date("2026-08-17T02:00:00Z"), 20, "America/New_York")).toBe("2026-09-05");
  });
});

describe("formatDate", () => {
  it("renders an ISO calendar date as long form", () => {
    expect(formatDate("2026-08-21")).toBe("21 August 2026");
  });

  it("is the same date whatever the machine's own zone is", () => {
    // A calendar date is not an instant. The 21st is the 21st everywhere.
    const tz = process.env.TZ;
    process.env.TZ = "Pacific/Auckland";
    expect(formatDate("2026-08-21")).toBe("21 August 2026");
    process.env.TZ = "America/Los_Angeles";
    expect(formatDate("2026-08-21")).toBe("21 August 2026");
    process.env.TZ = tz;
  });

  it("handles the first and last day of a year", () => {
    expect(formatDate("2027-01-01")).toBe("1 January 2027");
    expect(formatDate("2026-12-31")).toBe("31 December 2026");
  });
});
