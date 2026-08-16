import { UNKNOWN, type Fact } from "../content/types";

export type FactItem = { label: string; value: Fact; note?: string };

/**
 * Label and value rows. A fact we do not hold renders as a visible, marked slot
 * rather than a blank or a guess, so it cannot ship looking like an answer.
 */
export function FactList({ items }: { items: FactItem[] }) {
  return (
    <dl className="factlist">
      {items.map((f) => (
        <div className="factlist__row" key={f.label}>
          <dt className="factlist__label">{f.label}</dt>
          <dd className="factlist__value">
            {f.value === UNKNOWN ? (
              <span className="factlist__missing">
                Not confirmed yet. Ask us before you arrive.
              </span>
            ) : (
              <span className="factlist__fact">{f.value as string}</span>
            )}
            {f.note ? <span className="factlist__note">{f.note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
