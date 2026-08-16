import type { Metadata } from "next";
import { UNKNOWN, type Property } from "../../content/types";
import { FactList } from "../../components/FactList";
import { Callout } from "../../components/Callout";
import { GuideNav } from "../../components/GuideNav";

/**
 * The house manual, ordered by when a resident needs a thing rather than by
 * rule category. Sections come entirely from `property.guidebook`, so a new
 * property writes content and nothing else.
 *
 * A credential can never appear here: `validateProperty` rejects a secret
 * declared outside `arrival`, and the harness proves it against served HTML.
 */
const SURFACES = ["paper", "sand", "paper", "shell", "paper", "sand", "ink"] as const;

export function guidebookMetadata(p: Property): Metadata {
  return {
    title: `House guidebook, ${p.address.street}`,
    description: `Getting in, the first hour, living here, and who to call at ${p.name}.`,
    robots: { index: false, follow: false, nocache: true },
    alternates: { canonical: "/guidebook" },
  };
}

export function GuidebookPage({ property: p }: { property: Property }) {
  const sections = p.guidebook ?? [];
  return (
    <main id="main">
      <header className="guide-hero">
        <div className="wrap guide-hero__inner">
          <span className="eyebrow">{p.address.street}</span>
          <h1>The house guidebook</h1>
          <p>
            Everything you need while you are here, in the order you tend to need it. Keep this
            link; it does not expire while you are staying.
          </p>
        </div>
      </header>

      <section className="section section--paper">
        <div className="wrap">
          <GuideNav current="guidebook" modules={p.modules} />
        </div>
      </section>

      {sections.map((s, i) => (
        <section className={`section section--${SURFACES[i % SURFACES.length]}`} id={s.id} key={s.id}>
          <div className="wrap">
            <div className="section__head">
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <h2>{s.title}</h2>
            </div>

            {s.body.map((para) => (
              <p className="lead" key={para.slice(0, 40)} style={{ maxWidth: "62ch" }}>
                {para}
              </p>
            ))}

            {s.facts?.length ? <FactList items={s.facts} /> : null}

            {s.list?.length ? (
              <ul style={{ maxWidth: "62ch", marginTop: "1.2rem" }}>
                {s.list.map((li) => (
                  <li key={li} style={{ marginBottom: ".4rem" }}>
                    {li}
                  </li>
                ))}
              </ul>
            ) : null}

            {s.callout ? (
              <Callout tone={s.tone ?? "plain"}>
                <p>{s.callout}</p>
              </Callout>
            ) : null}
          </div>
        </section>
      ))}

      <section className="section section--ink">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">If something goes wrong</span>
            <h2>Who to call.</h2>
          </div>
          <FactList
            items={[
              {
                label: p.operator.name,
                value: p.operator.phone,
                note: "Anything about the home itself, day or night.",
              },
              { label: "Emergency", value: "911", note: "Fire, medical help, or to report a crime." },
            ]}
          />
          {p.arrival?.length ? (
            <Callout>
              <p>
                Your gate code, wifi and door code are in your arrival link, not on this page. If you
                cannot find it, call us and we will resend it.
              </p>
            </Callout>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export { UNKNOWN };
