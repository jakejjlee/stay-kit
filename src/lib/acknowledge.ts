export { zonedDateStamp } from "./dates";

export type AckInput = {
  names: string;
  unit: string;
  email: string;
  startDate: string;
  signature: string;
  accepted: boolean;
  company?: string; // honeypot
};

export type AckClean = {
  names: string;
  unit: string;
  email: string;
  startDate: string;
  signature: string;
};

export type AckResult =
  | { ok: true; value: AckClean }
  | { ok: false; field: keyof AckInput | "form"; message: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Loose comparison so "Susan Berman" and "susan  berman" match, but initials do not. */
function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateAcknowledgment(input: AckInput): AckResult {
  if (input.company && input.company.trim()) {
    return { ok: false, field: "form", message: "Rejected." };
  }

  const names = (input.names || "").trim().replace(/\s+/g, " ");
  const unit = (input.unit || "").trim();
  const email = (input.email || "").trim();
  const startDate = (input.startDate || "").trim();
  const signature = (input.signature || "").trim().replace(/\s+/g, " ");

  if (!names) {
    return { ok: false, field: "names", message: "Please add the full name of everyone signing." };
  }
  if (!unit) {
    return { ok: false, field: "unit", message: "Please add the unit number." };
  }
  if (!EMAIL.test(email)) {
    return { ok: false, field: "email", message: "Please add a valid email address." };
  }
  if (!ISO_DATE.test(startDate)) {
    return { ok: false, field: "startDate", message: "Please pick your lease start date." };
  }
  if (!signature) {
    return { ok: false, field: "signature", message: "Please type your signature." };
  }
  if (normalize(signature) !== normalize(names)) {
    return {
      ok: false,
      field: "signature",
      message: "Your typed signature should match the name above.",
    };
  }
  if (!input.accepted) {
    return {
      ok: false,
      field: "accepted",
      message: "Please confirm you have received and read the rules.",
    };
  }

  return { ok: true, value: { names, unit, email, startDate, signature } };
}

