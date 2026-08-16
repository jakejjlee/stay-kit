import { describe, expect, it } from "vitest";
import { validateProperty } from "../src/content/validate";
import { secret, type Property } from "../src/content/types";

// The character itself, built from its escape. The literal must never sit in a
// source file here: the repo bans it, and these tests exist to prove the
// validator catches it.
const EM = "\u2014";

const base: Property = {
  slug: "bluebill",
  name: "Bluebill",
  address: { street: "11 Bluebill Avenue", city: "Naples", state: "FL", zip: "34108" },
  timezone: "America/New_York",
  operator: { name: "Palisade Stays", phone: "201 321 5446", email: "jake@palisadestays.com" },
  brand: { accent: "#2f7d6a", accentText: "#266857", wordmark: "Bluebill" },
  spine: "A furnished residence by the month.",
  units: [
    {
      id: "201",
      name: "Unit 201",
      beds: 2,
      baths: 2,
      rent: { amount: 9124, period: "month" },
      includes: ["Reserved parking"],
      status: { kind: "available" },
      photos: ["/photos/a.jpg"],
    },
  ],
  modules: ["marketing", "units"],
};

describe("validateProperty", () => {
  it("accepts a complete property", () => {
    expect(validateProperty(base)).toEqual([]);
  });

  it("rejects a property with no units", () => {
    expect(validateProperty({ ...base, units: [] })).toContain("units: at least one unit is required");
  });

  it("rejects duplicate unit ids", () => {
    const u = base.units[0];
    const p = { ...base, units: [u, { ...u, name: "Other" }] };
    expect(validateProperty(p)).toContain('units: duplicate unit id "201"');
  });

  it("rejects an availableFrom date that is not ISO", () => {
    const p: Property = {
      ...base,
      units: [{ ...base.units[0], status: { kind: "availableFrom", date: "21/08/2026" } }],
    };
    expect(validateProperty(p)).toContain('units[201]: status date "21/08/2026" is not YYYY-MM-DD');
  });

  it("rejects an unknown timezone", () => {
    expect(validateProperty({ ...base, timezone: "Mars/Olympus" })).toContain(
      'timezone: "Mars/Olympus" is not a valid IANA timezone',
    );
  });

  it("rejects the arrival module without arrival content", () => {
    const p: Property = { ...base, modules: ["marketing", "units", "arrival"] };
    expect(validateProperty(p)).toContain("arrival: the module is on but no arrival facts are declared");
  });

  it("rejects a secret declared outside arrival", () => {
    const p: Property = {
      ...base,
      guidebook: [
        { id: "in", title: "Getting in", body: [], facts: [{ label: "Gate", value: secret("0516") as never }] },
      ],
    };
    expect(validateProperty(p)).toContain("guidebook[in]: a secret cannot be declared outside arrival");
  });

  it("allows a secret inside arrival", () => {
    const p: Property = {
      ...base,
      modules: ["marketing", "units", "arrival"],
      arrival: [{ label: "Gate code", value: secret("0516") }],
    };
    expect(validateProperty(p)).toEqual([]);
  });

  it("rejects an em dash in the spine", () => {
    expect(validateProperty({ ...base, spine: `A furnished residence ${EM} by the month.` })).toContain(
      "spine: contains an em dash",
    );
  });

  it("rejects an em dash anywhere in a guidebook section", () => {
    const p: Property = {
      ...base,
      guidebook: [{ id: "in", title: "Getting in", body: [`Take the elevator ${EM} to three.`] }],
    };
    expect(validateProperty(p)).toContain("guidebook[in]: contains an em dash");
  });

  it("reports every problem at once rather than the first", () => {
    const p: Property = { ...base, units: [], timezone: "Mars/Olympus" };
    expect(validateProperty(p).length).toBe(2);
  });
});
