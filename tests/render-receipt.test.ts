import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { it } from "vitest";
import { buildReceipt } from "../src/api/inquiry-receipt";
import type { Property } from "../src/content/types";

/**
 * Proof renderer, off unless RENDER_RECEIPTS=<dir> is set. The property and
 * answers are SAMPLES for the proof page only; nothing here is sent.
 */
const dir = process.env.RENDER_RECEIPTS;
const stripped = (html: string) =>
  html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<link\b[^>]*>/gi, "").replace(/\sclass="[^"]*"/g, "");

const sample: Property = {
  slug: "sample", name: "Bluebill", timezone: "America/New_York",
  address: { street: "11 Bluebill Avenue", city: "Naples", state: "FL", zip: "34108" },
  operator: { name: "Palisade Stays", phone: "201 321 5446", email: "hello@palisadestays.com" },
  brand: { accent: "#2f7d6a", accentText: "#266857", wordmark: "Bluebill" },
  spine: "A furnished residence by the month.", units: [], modules: ["marketing"],
};

it.skipIf(!dir)("renders the receipt for the proof page", () => {
  const m = buildReceipt(sample, {
    name: "Dana Lee", email: "dana@example.com", startDate: "2027-01-05", length: "3 months", adults: "2",
    unit: "Unit 201", reason: "Relocating for work", budget: "9000 a month", pets: "One cat",
    message: "Can we see the unit by video before we decide?",
  }, new Date("2026-11-23T21:12:00Z"));
  mkdirSync(dir as string, { recursive: true });
  writeFileSync(join(dir as string, "receipt.html"), m.html);
  writeFileSync(join(dir as string, "receipt-gmail.html"), stripped(m.html));
  writeFileSync(join(dir as string, "receipt.txt"), `${m.subject}\n\n${m.text}`);
});
