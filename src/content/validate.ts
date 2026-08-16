import { isSecret, type Property } from "./types";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** The character itself, written as an escape so the literal never sits in source. */
const EM_DASH = "\u2014";

function validTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Walks every string in a value looking for an em dash. Skips secret boxes. */
function hasEmDash(v: unknown): boolean {
  if (typeof v === "string") return v.includes(EM_DASH);
  if (Array.isArray(v)) return v.some(hasEmDash);
  if (v && typeof v === "object" && !isSecret(v)) return Object.values(v).some(hasEmDash);
  return false;
}

/**
 * Every problem with a property description, as human-readable lines.
 * Empty means valid. Reports all problems at once rather than the first, so a
 * content edit gets fixed in one pass instead of a game of whack-a-mole.
 */
export function validateProperty(p: Property): string[] {
  const problems: string[] = [];

  if (!validTimezone(p.timezone)) {
    problems.push(`timezone: "${p.timezone}" is not a valid IANA timezone`);
  }

  if (p.units.length === 0) {
    problems.push("units: at least one unit is required");
  }

  const seen = new Set<string>();
  for (const u of p.units) {
    if (seen.has(u.id)) problems.push(`units: duplicate unit id "${u.id}"`);
    seen.add(u.id);
    if (u.status.kind === "availableFrom" && !ISO.test(u.status.date)) {
      problems.push(`units[${u.id}]: status date "${u.status.date}" is not YYYY-MM-DD`);
    }
    if (u.status.kind === "held" && !ISO.test(u.status.until)) {
      problems.push(`units[${u.id}]: status date "${u.status.until}" is not YYYY-MM-DD`);
    }
    if (u.status.kind === "leased" && u.status.until && !ISO.test(u.status.until)) {
      problems.push(`units[${u.id}]: status date "${u.status.until}" is not YYYY-MM-DD`);
    }
  }

  if (p.modules.includes("arrival") && !(p.arrival && p.arrival.length)) {
    problems.push("arrival: the module is on but no arrival facts are declared");
  }

  // A credential may only be declared inside `arrival`. Anywhere else it would
  // reach a public route, which is the exact mistake this kit exists to prevent.
  for (const g of p.guidebook ?? []) {
    for (const f of g.facts ?? []) {
      if (isSecret(f.value)) {
        problems.push(`guidebook[${g.id}]: a secret cannot be declared outside arrival`);
      }
    }
  }

  if (hasEmDash(p.spine)) problems.push("spine: contains an em dash");
  for (const g of p.guidebook ?? []) {
    if (hasEmDash(g)) problems.push(`guidebook[${g.id}]: contains an em dash`);
  }
  for (const r of p.rules ?? []) {
    if (hasEmDash(r)) problems.push(`rules[${r.id}]: contains an em dash`);
  }
  for (const s of p.process ?? []) {
    if (hasEmDash(s)) problems.push(`process[${s.n}]: contains an em dash`);
  }

  return problems;
}
