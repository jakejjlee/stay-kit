/** A fact nobody has recorded. Renders as a visible marked slot, never a guess. */
export const UNKNOWN = Symbol("unknown-fact");
export type Fact = string | typeof UNKNOWN;

const SECRET_BRAND = Symbol("secret");
const SECRET_READ = Symbol("secret-read");

/**
 * An opaque box around a credential.
 *
 * It is deliberately NOT a string. React cannot render it, a template literal
 * cannot interpolate it, and both `toString` and `toJSON` are overridden, so it
 * cannot leak by accident. The value itself lives behind a non-enumerable
 * symbol, so a spread, `Object.keys` or `JSON.stringify` never sees it.
 *
 * Only `revealSecret` opens the box, and only the arrival module calls it.
 * `harness/secrets.mjs` then proves the guarantee at build time by fetching
 * every public route and asserting no declared secret appears in the HTML.
 *
 * This exists because the first Bluebill build rendered a gate code and a wifi
 * password into the public HTML of its guidebook. A noindex tag is not access
 * control.
 */
export type Secret = {
  readonly [SECRET_BRAND]: true;
  toString(): string;
  toJSON(): string;
};

export function secret(value: string): Secret {
  const box = {
    toString: () => "[secret]",
    toJSON: () => "[secret]",
  };
  Object.defineProperty(box, SECRET_BRAND, { value: true, enumerable: false });
  Object.defineProperty(box, SECRET_READ, { value: () => value, enumerable: false });
  return box as unknown as Secret;
}

export function isSecret(v: unknown): v is Secret {
  return typeof v === "object" && v !== null && SECRET_BRAND in v;
}

export function revealSecret(s: Secret): string {
  return (s as unknown as { [SECRET_READ]: () => string })[SECRET_READ]();
}

export type Operator = {
  name: string;
  url?: string;
  phone: string;
  email: string;
};

export type Money = {
  amount: number;
  period: "month" | "night";
  note?: string;
};

export type UnitStatus =
  | { kind: "available" }
  | { kind: "availableFrom"; date: string } // ISO, rendered in Property.timezone
  | { kind: "leased"; until?: string }
  | { kind: "held"; until: string };

export type Unit = {
  id: string;
  name: string;
  beds: number;
  baths: number;
  sqft?: number;
  sleeps?: number;
  rent: Money;
  includes: string[];
  status: UnitStatus;
  photos: string[];
  note?: string;
};

export type ProcessStep = {
  n: string;
  title: string;
  body: string;
  /** The step carrying the friction. Rendered prominently rather than buried. */
  flag?: boolean;
  href?: string;
};

export type GuideSection = {
  id: string;
  title: string;
  body: string[];
  facts?: { label: string; value: Fact; note?: string }[];
  list?: string[];
  callout?: string;
  tone?: "money" | "safety" | "plain";
};

export type RuleSection = {
  id: string;
  title: string;
  /** Where this came from, so any line can be traced back. */
  source: string;
  body: string[];
  list?: string[];
  callout?: string;
  /** Our own addition, not the source document's text. */
  ours?: boolean;
};

export type ModuleName =
  | "marketing"
  | "units"
  | "rates"
  | "apply"
  | "rules"
  | "guidebook"
  | "inquiry"
  | "arrival"
  | "hold";

export type Property = {
  slug: string;
  name: string;
  address: { street: string; city: string; state: string; zip: string; geo?: [number, number] };
  timezone: string;
  operator: Operator;
  brand: { accent: string; accentText: string; wordmark: string };
  /** The one sentence the whole site rests on. */
  spine: string;
  units: Unit[];
  modules: ModuleName[];
  /** Days an application must precede the start date. Undefined means no approval gate. */
  approvalLeadDays?: number;
  process?: ProcessStep[];
  guidebook?: GuideSection[];
  rules?: RuleSection[];
  faq?: { q: string; a: string }[];
  location?: { drives: { label: string; minutes: number }[]; note?: string };
  /** Only ever rendered on a tokenised arrival route. */
  arrival?: { label: string; value: Secret | Fact }[];
};
