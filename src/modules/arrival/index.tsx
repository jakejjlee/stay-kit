import type { Metadata } from "next";
import { isSecret, revealSecret, UNKNOWN, type Property } from "../../content/types";
import { Callout } from "../../components/Callout";

/**
 * The arrival pack: one private page per booking, reached only by an
 * unguessable token.
 *
 * THIS IS THE ONLY FILE IN THE KIT THAT MAY IMPORT `revealSecret`.
 * `harness/naming.mjs` asserts that, so the rule is enforced rather than
 * remembered. Everything a guest needs at the front door lives here, and
 * nothing secret is allowed to live anywhere else.
 */
export function arrivalMetadata(p: Property): Metadata {
  return {
    title: `Your arrival details, ${p.address.street}`,
    // Belt and braces: the route is tokenised, disallowed in robots, and
    // marked noindex. None of the three is sufficient alone.
    robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
  };
}

export function ArrivalPage({ property: p }: { property: Property }) {
  const facts = p.arrival ?? [];
  return (
    <main id="main">
      <section className="section section--paper">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">{p.address.street}</span>
            <h1>Getting in</h1>
            <p className="lead" style={{ maxWidth: "58ch" }}>
              These are yours for this stay. The door code changes between guests, so this link
              stops working after you check out.
            </p>
          </div>

          <dl className="factlist">
            {facts.map((f) => (
              <div className="factlist__row" key={f.label}>
                <dt className="factlist__label">{f.label}</dt>
                <dd className="factlist__value">
                  <span className="factlist__fact">
                    {isSecret(f.value)
                      ? revealSecret(f.value)
                      : f.value === UNKNOWN
                        ? "Not confirmed yet. Ask us before you arrive."
                        : (f.value as string)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <Callout tone="safety">
            <p>
              Please do not forward this link. It carries the codes to the building and the home.
              If you need it sent to someone else in your party, call us and we will send them
              their own.
            </p>
          </Callout>

          <p style={{ marginTop: "1.6rem" }}>
            <a href="/guidebook" className="cta solid">
              The rest of the house guidebook
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
