import Image from "next/image";
import type { ProcessStep, Property } from "../content/types";
import { Callout } from "../components/Callout";
import { FactList } from "../components/FactList";

/**
 * The blocks a property composes its own page from.
 *
 * Deliberately NOT one canned page builder. One property's homepage may be
 * art-directed and another's needs a different arc; forcing both through a
 * single template is how a system flattens the thing it was meant to protect.
 * The kit supplies the bones, each property composes them.
 */

export function Hero({
  property: p,
  headline,
  sub,
  photo,
  children,
}: {
  property: Property;
  headline: string;
  sub: string;
  photo?: { src: string; alt: string };
  children?: React.ReactNode;
}) {
  const open = p.units.filter((u) => u.status.kind !== "leased").length;
  return (
    <header className="hero hero--split" id="top">
      <div className="hero__type">
        <span className="eyebrow">
          {p.address.city}, {p.address.state}
        </span>
        <h1>{headline}</h1>
        <p className="hero__sub">{sub}</p>
        <div className="hero__actions">
          <a href="#inquire" className="cta solid">
            Request your dates
          </a>
          {p.modules.includes("apply") ? (
            <a href="/apply" className="cta line">
              How applying works
            </a>
          ) : null}
        </div>
        <p className="hero__meta">
          {p.units.length === 1
            ? `${p.units[0].beds} bed · ${p.units[0].baths} bath`
            : `${p.units.length} apartments · ${open} available`}
        </p>
        {children}
      </div>
      <div className="hero__pic">
        {photo ? (
          <Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 900px) 100vw, 55vw" style={{ objectFit: "cover" }} />
        ) : (
          // No photograph yet. Say so rather than shipping a broken frame.
          <div className="hero__pic-slot">
            <span>Photographs to come</span>
          </div>
        )}
      </div>
    </header>
  );
}

export function Process({ steps, title = "How it works" }: { steps: ProcessStep[]; title?: string }) {
  return (
    <section className="section section--paper" id="how">
      <div className="wrap">
        <div className="section__head">
          <span className="eyebrow">The sequence</span>
          <h2>{title}</h2>
        </div>
        <ol className="steps">
          {steps.map((s) => (
            <li key={s.n} className={s.flag ? "step--flag" : undefined}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {s.href ? (
                <p>
                  <a href={s.href}>Read what that involves</a>
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Location({ property: p }: { property: Property }) {
  if (!p.location) return null;
  return (
    <section className="section section--sand" id="location">
      <div className="wrap">
        <div className="section__head">
          <span className="eyebrow">The location</span>
          <h2>What is close.</h2>
        </div>
        <FactList
          items={p.location.drives.map((d) => ({
            label: d.label,
            value: `${d.minutes} min`,
          }))}
        />
        {p.location.note ? <p className="muted" style={{ marginTop: "1.2rem" }}>{p.location.note}</p> : null}
      </div>
    </section>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="section section--paper" id="faq">
      <div className="wrap">
        <div className="section__head">
          <span className="eyebrow">Good to know</span>
          <h2>Questions people ask first.</h2>
        </div>
        <div className="faq">
          {items.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Proof({ property: p, children }: { property: Property; children?: React.ReactNode }) {
  return (
    <section className="section section--ink" id="proof">
      <div className="wrap">
        <div className="section__head">
          <span className="eyebrow">Who you are dealing with</span>
          <h2>Managed by {p.operator.name}.</h2>
        </div>
        {children}
        <Callout>
          <p>
            Every stay runs on a written agreement. Questions go to a person, on{" "}
            {p.operator.phone}, not a form queue.
          </p>
        </Callout>
      </div>
    </section>
  );
}

export function Footer({ property: p }: { property: Property }) {
  const guest = [
    p.modules.includes("apply") && (["/apply", "Applying"] as const),
    p.modules.includes("guidebook") && (["/guidebook", "House guidebook"] as const),
    p.modules.includes("rules") && (["/rules", "House rules"] as const),
  ].filter(Boolean) as (readonly [string, string])[];

  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          <p className="footer__mark">{p.brand.wordmark}</p>
          <p className="muted">
            {p.address.street}
            <br />
            {p.address.city}, {p.address.state} {p.address.zip}
          </p>
        </div>
        {guest.length ? (
          <nav aria-label="Guest pages">
            <p className="footer__head">For residents</p>
            {guest.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
        ) : null}
        <div>
          <p className="footer__head">Contact</p>
          <a href={`tel:${p.operator.phone.replace(/[^0-9+]/g, "")}`}>{p.operator.phone}</a>
          <a href={`mailto:${p.operator.email}`}>{p.operator.email}</a>
          <p className="muted" style={{ marginTop: ".6rem" }}>
            Managed by {p.operator.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
