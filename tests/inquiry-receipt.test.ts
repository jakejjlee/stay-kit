import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lintSignerEmail } from "@iserlabs/sign-kit/mail";
import type { Property } from "../src/content/types";

const sent: Record<string, unknown>[] = [];
let failReceipt = false;
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (m: Record<string, unknown>) => {
        sent.push(m);
        if (failReceipt && String(m.subject).includes("| Inquiry |")) throw new Error("receipt down");
        return { error: null };
      },
    };
  },
}));

import { createInquireRoute } from "../src/api/inquire";
import { buildReceipt, receiptSender, sendReceipt } from "../src/api/inquiry-receipt";

const property: Property = {
  slug: "bluebill",
  name: "Bluebill",
  address: { street: "11 Bluebill Avenue", city: "Naples", state: "FL", zip: "34108" },
  timezone: "America/New_York",
  operator: { name: "Palisade Stays", phone: "201 321 5446", email: "hello@palisadestays.com" },
  brand: { accent: "#2f7d6a", accentText: "#266857", wordmark: "Bluebill" },
  spine: "A furnished residence by the month.",
  units: [],
  modules: ["marketing"],
};
const AT = new Date("2026-11-23T21:12:00Z");
const ANSWERS = {
  name: "Dana Lee", email: "dana@example.com", phone: "555 010 0199", startDate: "2027-01-05",
  length: "3 months", adults: "2", unit: "Unit 201", reason: "Relocating for work",
  budget: "9000", pets: "One cat", vehicles: "One car", message: "Hello there",
};

beforeEach(() => {
  sent.length = 0;
  failReceipt = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe("receipt email", () => {
  it("carries every answer typed, in html and plain text", () => {
    const m = buildReceipt(property, ANSWERS, AT);
    for (const v of Object.values(ANSWERS)) {
      if (v !== ANSWERS.email) expect(m.html).toContain(v); // an address is drawn broken up so Gmail cannot link it
      expect(m.text).toContain(v);
    }
  });

  it("passes the kit lint (a typed phone number is the guest's own answer)", () => {
    expect(lintSignerEmail(buildReceipt(property, { ...ANSWERS, phone: undefined }, AT))).toEqual([]);
  });

  it("escapes html in what was typed", () => {
    const m = buildReceipt(property, { ...ANSWERS, message: "<script>alert(1)</script> & <b>x</b>" }, AT);
    expect(m.html).not.toContain("<script>alert");
    expect(m.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;b&gt;x&lt;/b&gt;");
  });

  it("prints a blank answer as Not given", () => {
    expect(buildReceipt(property, { name: "Dana Lee", email: "dana@example.com" }, AT).text).toContain("Pets: Not given");
  });
});

describe("sender", () => {
  it("never falls back to the shared test address", () => {
    expect(receiptSender(property, {})).toBe("Bluebill <hello@palisadestays.com>");
    expect(receiptSender({ ...property, operator: { ...property.operator, email: "" } }, {})).toBeUndefined();
    expect(receiptSender(property, { LEAD_FROM_EMAIL: "Bluebill <hello@palisadestays.com>" })).toBe("Bluebill <hello@palisadestays.com>");
  });

  it("with no verified sender, logs a named line and sends nothing", async () => {
    const send = vi.fn();
    const p = { ...property, operator: { ...property.operator, email: "" } };
    expect(await sendReceipt(p, ANSWERS, send, {}, AT)).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[bluebill/inquire] receipt not sent to dana@example.com: no verified sender"));
  });

  it("sends once, only to the submitter, reply-to the operator inbox", async () => {
    const send = vi.fn(async () => ({ error: null }));
    expect(await sendReceipt(property, ANSWERS, send, {}, AT)).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    const m = (send.mock.calls[0] as unknown as [Record<string, string>])[0];
    expect(m.to).toBe("dana@example.com");
    expect(m.replyTo).toBe("hello@palisadestays.com");
    expect(m.from).not.toContain("resend.dev");
  });
});

describe("POST inquire (mailer mocked)", () => {
  const post = (body: unknown) =>
    createInquireRoute(property).POST(new Request("https://x.test/api/inquire", { method: "POST", body: JSON.stringify(body) }));

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "key");
    delete process.env.LEAD_FROM_EMAIL;
    delete process.env.LEAD_TO_EMAIL;
  });

  it("alert to the operator plus exactly one receipt to the submitter", async () => {
    const res = await post(ANSWERS);
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(2);
    expect(sent.filter((m) => m.to === "dana@example.com")).toHaveLength(1);
  });

  it("a failed receipt still returns the form's success", async () => {
    failReceipt = true;
    const res = await post(ANSWERS);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("receipt send failed for dana@example.com"), expect.anything());
  });

  it("a honeypot hit sends nothing", async () => {
    await post({ ...ANSWERS, company: "spam" });
    expect(sent).toHaveLength(0);
  });
});
