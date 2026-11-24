import { type BuiltEmail, makePalette, renderReceiptEmail } from "@iserlabs/sign-kit/mail";
import type { Property } from "../content/types";

/**
 * The one receipt a person gets after the inquiry form: their own answers back
 * for checking, on the shared Certificate design (the sign-kit mail core).
 * Sent only to the person who submitted, from the property's configured
 * sender, reply-to the property's operator inbox. Nothing else rides on it.
 *
 * There is no fallback sender: onboarding@resend.dev is a shared test address,
 * not an inbox anyone reads. With no usable sender the receipt is skipped and
 * one named line says so.
 */

export type ReceiptAnswers = {
  name?: string; email?: string; phone?: string;
  startDate?: string; length?: string; adults?: string;
  unit?: string; reason?: string; budget?: string;
  pets?: string; vehicles?: string; message?: string;
};

const EMAIL = /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/;

/** The verified sender for this property, or undefined when none is set. */
export function receiptSender(property: Property, env: Record<string, string | undefined> = process.env): string | undefined {
  const configured = env.LEAD_FROM_EMAIL?.trim();
  if (configured) {
    const bare = /<([^>]+)>/.exec(configured)?.[1] ?? configured;
    return EMAIL.test(bare.trim()) ? configured : undefined;
  }
  const inbox = property.operator.email?.trim();
  return inbox && EMAIL.test(inbox) ? `${property.name} <${inbox}>` : undefined;
}

function clock(at: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
  }).formatToParts(at);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("month")} ${g("day")}, ${g("year")}, ${g("hour")}:${g("minute")} ${g("dayPeriod").toUpperCase()} ${g("timeZoneName")}`;
}

const given = (v: string | undefined) => (v?.trim() ? v.trim() : "Not given");

export function buildReceipt(property: Property, a: ReceiptAnswers, at: Date = new Date()): BuiltEmail {
  const when = clock(at, property.timezone);
  const name = (a.name ?? "").trim();
  const first = name.split(/\s+/)[0] || "there";
  const shortDay = (when.split(",")[0] ?? "").replace(/^([A-Z][a-z]{2})[a-z]*/, "$1");
  return renderReceiptEmail({
    palette: makePalette({
      paper: "#fbf8f1", ground: "#f3ede1", rule: "#e5dac4",
      band: property.brand.accent, bandText: property.brand.accentText, accent: property.brand.accent,
    }),
    faces: {
      serif: "Georgia,'Iowan Old Style',Charter,serif",
      sans: "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif",
      wordmark: "Georgia,'Iowan Old Style',Charter,serif",
    },
    brandName: property.name,
    subject: `${property.name} | Inquiry | Received from ${name}, ${shortDay}`,
    headline: `${first}, your inquiry arrived at ${when.split(", ").slice(-1)[0]}.`,
    lead: ["We have it. Someone will write back to you at the email below."],
    sheetTitle: "What you sent",
    caption: "Check it over. If anything is wrong, reply to this email and say what to change.",
    received: [
      { label: "Name", value: given(a.name) },
      { label: "Email", value: given(a.email) },
      { label: "Phone", value: given(a.phone) },
      { label: "Move in", value: given(a.startDate) },
      { label: "Length", value: given(a.length) },
      { label: "Adults", value: given(a.adults) },
      { label: "Unit", value: given(a.unit) },
      { label: "Reason for moving", value: given(a.reason) },
      { label: "Budget", value: given(a.budget) },
      { label: "Pets", value: given(a.pets) },
      { label: "Vehicles", value: given(a.vehicles) },
      { label: "Message", value: given(a.message) },
    ],
    receivedWhen: when,
    about: "Inquiry",
    replyLine: `Reply to this email and it reaches ${property.name}.`,
    legalLine: `${property.name}, ${property.address.street}, ${property.address.city}, ${property.address.state}`,
  });
}

type Sender = (msg: { from: string; to: string; replyTo: string; subject: string; html: string; text: string }) => Promise<{ error?: { message: string } | null }>;

/**
 * Send the receipt to the submitter only. Awaited; every failure logs one
 * named line and returns false. It never throws, so the form's answer cannot
 * change because of it.
 */
export async function sendReceipt(
  property: Property,
  answers: ReceiptAnswers,
  send: Sender,
  env: Record<string, string | undefined> = process.env,
  at: Date = new Date(),
): Promise<boolean> {
  const to = (answers.email ?? "").trim();
  const from = receiptSender(property, env);
  if (!from) {
    console.error(`[${property.slug}/inquire] receipt not sent to ${to}: no verified sender is set (LEAD_FROM_EMAIL or operator.email)`);
    return false;
  }
  try {
    const built = buildReceipt(property, answers, at);
    const { error } = await send({ from, to, replyTo: property.operator.email, subject: built.subject, html: built.html, text: built.text });
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    console.error(`[${property.slug}/inquire] receipt send failed for ${to}:`, err);
    return false;
  }
}
