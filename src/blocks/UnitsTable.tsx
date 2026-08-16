import { formatDate } from "../lib/dates";
import type { Unit, UnitStatus } from "../content/types";

/**
 * The block that makes a three unit building cost the same as a one unit
 * condo. One unit collapses to a single spec card; two or more render as a
 * comparison the reader can scan down.
 */
function statusLabel(s: UnitStatus): { text: string; tone: "open" | "soon" | "closed" } {
  switch (s.kind) {
    case "available":
      return { text: "Available now", tone: "open" };
    case "availableFrom":
      return { text: `Available ${formatDate(s.date)}`, tone: "soon" };
    case "held":
      return { text: `Held until ${formatDate(s.until)}`, tone: "soon" };
    case "leased":
      return { text: s.until ? `Leased to ${formatDate(s.until)}` : "Leased", tone: "closed" };
  }
}

function money(m: Unit["rent"]): string {
  return `$${m.amount.toLocaleString("en-US")} a ${m.period}`;
}

function spec(u: Unit): string {
  const parts = [`${u.beds} bed`, `${u.baths} bath`];
  if (u.sqft) parts.push(`${u.sqft.toLocaleString("en-US")} sq ft`);
  if (u.sleeps) parts.push(`sleeps ${u.sleeps}`);
  return parts.join(" · ");
}

export function UnitsTable({ units }: { units: Unit[] }) {
  const single = units.length === 1;
  return (
    <div className={single ? "units units--single" : "units"}>
      {units.map((u) => {
        const s = statusLabel(u.status);
        return (
          <article className="unit" key={u.id}>
            <header className="unit__head">
              <h3>{u.name}</h3>
              <span className={`unit__status unit__status--${s.tone}`}>{s.text}</span>
            </header>
            <p className="unit__spec">{spec(u)}</p>
            <p className="unit__rent">{money(u.rent)}</p>
            {u.rent.note ? <p className="unit__note">{u.rent.note}</p> : null}
            {u.includes.length ? (
              <ul className="unit__includes">
                {u.includes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : null}
            {u.photos.length === 0 ? (
              <p className="unit__note">
                <span className="unit__slot">Photographs to come</span>
              </p>
            ) : null}
            {u.note ? <p className="unit__note">{u.note}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
