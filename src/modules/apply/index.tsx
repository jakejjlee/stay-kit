import type { Metadata } from "next";
import type { Property } from "../../content/types";
import { earliestStart, formatDate } from "../../lib/dates";
import { GuideNav } from "../../components/GuideNav";
import { Callout } from "../../components/Callout";
import { FactList } from "../../components/FactList";

/**
 * The application path.
 *
 * The steps are content, so a property with a condominium board and a twenty
 * day deadline and a property with neither run the same code. When
 * `approvalLeadDays` is undefined no deadline is claimed, because inventing a
 * runway a building does not have is as bad as hiding one it does.
 */
export function applyMetadata(p: Property): Metadata {
  return {
    title: `Applying to rent, ${p.address.street}`,
    description: `What applying involves at ${p.name}: what to have ready, what it costs, and who decides.`,
    robots: { index: false, follow: false, nocache: true },
    alternates: { canonical: "/apply" },
  };
}

export function ApplyPage({
  property: p,
  needed,
}: {
  property: Property;
  /** What an applicant should have to hand. Property specific. */
  needed?: { label: string; value: string; note?: string }[];
}) {
  const lead = p.approvalLeadDays;
  const soonest = lead ? earliestStart(new Date(), lead, p.timezone) : null;

  return (
    <main id="main">
      <header className="guide-hero">
        <div className="wrap guide-hero__inner">
          <span className="eyebrow">{p.address.street}</span>
          <h1>Applying to rent here</h1>
          <p>
            {lead
              ? "This building screens every renter before anyone moves in. It is a real process with a real deadline, so here is exactly what it involves."
              : "No board, no screening committee, no waiting for a vote. Here is the whole process, and it is short."}
          </p>
        </div>
      </header>

      <section className="section section--paper">
        <div className="wrap">
          <GuideNav current="apply" modules={p.modules} />

          {lead && soonest ? (
            <Callout tone="money">
              <p>
                <strong>
                  Your application must be complete {lead} days before your start date.
                </strong>{" "}
                Applying today, the soonest you could begin is{" "}
                <strong>{formatDate(soonest)}</strong>. Treat {lead} days as the last possible
                moment rather than the target.
              </p>
            </Callout>
          ) : (
            <Callout>
              <p>
                There is no association board here, so nothing waits on an outside committee. How
                fast this moves is down to how fast the paperwork comes back.
              </p>
            </Callout>
          )}

          {p.process?.length ? (
            <ol className="steps" style={{ marginTop: "2rem" }}>
              {p.process.map((s) => (
                <li key={s.n} className={s.flag ? "step--flag" : undefined}>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </section>

      {needed?.length ? (
        <section className="section section--sand">
          <div className="wrap">
            <div className="section__head">
              <span className="eyebrow">Before you begin</span>
              <h2>What to have in front of you.</h2>
            </div>
            <FactList items={needed} />
          </div>
        </section>
      ) : null}

      <section className="section section--ink">
        <div className="wrap">
          <div className="section__head">
            <span className="eyebrow">If you get stuck</span>
            <h2>Who to call.</h2>
          </div>
          <FactList
            items={[
              { label: p.operator.name, value: p.operator.phone, note: "The home, the dates, the lease." },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
