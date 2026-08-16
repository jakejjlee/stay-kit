# stay-kit: one property-site system, many properties

Design spec. Written 2026-08-16. Approved at the gate after three interrogation rounds.

## What this is

A shared package that turns the Bluebill build into a system every property can run on.

Bluebill (11 Bluebill Ave #201, Naples) shipped to production on 2026-08-16 after a full
rebuild. It works, it is measured, and right now it is a one-off. The next property is
**243 Lincoln Ave Units 1 to 3, Cliffside Park NJ**, owned by the same person (Jamarber
"Arber" Dobrushi). Copying the repo would mean two codebases immediately and six by the
end of the year.

`stay-kit` holds the design system, the blocks, the modules, the content types and the
verification harness. A property repo holds only its own content, photographs, accent
colour and mark.

## Decisions taken at the gate

1) **Mechanism:** a shared package with thin site repos. Not a fork per property, not one
   multi-tenant app.
2) **Unit model:** one page per property, units as a comparison section. Not a page per unit.
3) **Availability:** hand-maintained in the property's content file, shaped so a calendar
   feed can drive it later.
4) **Order:** extract the kit first, then build Lincoln on it as the proof.
5) **Brand:** shared bones (type system, layout language, blocks). Each property sets its
   own accent colour and its own mark.
6) **Modules:** all four proposed, plus a qualifying inquiry, an arrival pack, and a soft
   hold on a unit.
7) **Arrival pack protection:** an unguessable per-booking link that expires after checkout.
8) **Scope:** any property, any operator. The operator is a content field, so Palisade,
   Sun Mountain, Columbus and future client properties all work.

## Where it lives

1) `~/Claude/stay-kit`, a new repo, consumed as source and pinned to a git ref in each
   property's `package.json`. This is exactly how `@iserlabs/web-kit` is already consumed,
   so the pattern is familiar and the upgrade is deliberate: a property takes a change by
   bumping its ref, never by surprise.
2) Property repos stay where they are: `~/Claude/clients/bluebill`, and Lincoln in
   `~/Claude/clients/lincoln` (the existing `~/Claude/lincoln-corporate-stay` holds a single
   `index.html` and is superseded).

## The content model

This is the heart of the system. Every module reads from one description and nothing else.

```ts
type Operator = {
  name: string;            // "Palisade Stays"
  url?: string;
  phone: string;
  email: string;
};

type Money = { amount: number; period: "month" | "night"; note?: string };

type UnitStatus =
  | { kind: "available" }
  | { kind: "availableFrom"; date: string }   // ISO, rendered in the property's timezone
  | { kind: "leased"; until?: string };

type Unit = {
  id: string;              // "unit-2"
  name: string;            // "Unit 2"
  beds: number;
  baths: number;
  sqft?: number;
  sleeps?: number;
  rent: Money;
  includes: string[];      // "Reserved parking", "Heat and hot water"
  status: UnitStatus;
  photos: string[];
  note?: string;
};

type Property = {
  slug: string;
  name: string;
  address: { street: string; city: string; state: string; zip: string; geo?: [number, number] };
  timezone: string;        // every date renders through this, never a bare string
  operator: Operator;
  brand: { accent: string; accentText: string; markId: string; wordmark: string };
  units: Unit[];           // Bluebill has one, Lincoln has three
  modules: ModuleName[];   // opt in
  // module payloads, each optional and each pluggable content, never code
  process?: ProcessStep[];
  guidebook?: GuideSection[];
  rules?: RuleSection[];
  faq?: { q: string; a: string }[];
  location?: { drives: { label: string; minutes: number }[]; note?: string };
};
```

**The `UNKNOWN` sentinel from Bluebill carries over.** A fact nobody has recorded renders as
a visible marked slot, never as a blank and never as a guess. This is how the missing
parking space for #201 is currently surfaced and it stays.

## Modules

Nine, opt-in per property. `marketing` and `units` are always on.

1) **marketing** The homepage: hero, story, the place, the home, location, proof, ask.
2) **units** The comparison block. One unit collapses to a spec strip; three or more render
   as a table with rent, size and availability side by side.
3) **rates** Per-unit rent (Lincoln) or a seasonal band (Bluebill). Same block, two shapes.
4) **apply** The application and approval path. **The steps are content.** Bluebill's steps
   are the association's board approval, the 20 day deadline and the $150 screening fee.
   Lincoln's are an application, a lease and a deposit. No code differs.
5) **rules** House or association rules, ending in a signed acknowledgment that emails a
   record. Ported from Bluebill unchanged apart from the content source.
6) **guidebook** The house manual, ordered by when a resident needs a thing.
7) **inquiry** The qualifying form (below).
8) **arrival** The private arrival pack (below).
9) **hold** A soft hold on a unit (below).

### The qualifying inquiry

Bluebill's form collects seven things and qualifies almost none of them. The kit's form
collects what actually lets you answer once instead of three times:

1) Exact target start date, not a month. Every approval deadline is computed off a date.
2) Length of stay.
3) Adults aged 18 and over. This drives per-applicant screening fees and the timeline.
4) Budget band.
5) Which unit, where a property has more than one.
6) Why they are moving: relocation, insurance placement, remote work, between homes, local.
   Lincoln's audience is all of these and the answer changes the reply.
7) Pets and vehicles, because both are hard constraints at most properties.

The form computes and displays the earliest possible start date from the property's
approval lead time, so a prospect self-selects before they inquire rather than after.

### The arrival pack

One private page per booking at `/arrival/<token>`, where the token is 32 bytes of
randomness. It carries the door code, wifi, the parking space, the floor and the trash
room: everything currently trapped in a text thread the guest scrolls at the front door.

**It is the answer to the mistake Bluebill made.** The gate code and wifi password rendered
in the public HTML of `/guidebook`. A `noindex` tag is not access control, AI crawlers act
on `robots.txt`, and that policy flips to `Allow` at domain cutover. In the kit,
credentials can only ever live behind a token, enforced by type: the guidebook module
cannot accept a field marked `secret`.

The page is `noindex`, `Disallow`ed in robots, and expires after checkout.

### The soft hold

Jake asked for this against my recommendation to defer it, so it ships, and here is the
honest cost: **it needs persistent state and the kit has no database.**

1) Storage is Upstash Redis, already in the environment vocabulary. One key per hold,
   `hold:<property>:<unit>`, carrying the prospect's email and an expiry.
2) Default hold is 72 hours, configurable per property.
3) **If the Upstash credentials are absent the module refuses to render.** It does not show
   a hold button that silently fails. An unconfigured integration must look different from
   a working one, which is the rule Bluebill's forms already follow.
4) A held unit shows as held in the units block, with the date it frees up.

## Design system

Inherited from the Bluebill build, unchanged where it works:

1) **Type:** Newsreader (variable, real optical sizing, true italic) for display, Schibsted
   Grotesk for body, Geist Mono for labels, numbers and codes. Six size tokens, tracking
   that scales with size.
2) **Surfaces:** the paper / sand / shell / ink tonal set.
3) **Accent:** per property. Bluebill is deep emerald. Lincoln picks its own at its gate.
4) **Motion:** three easing tokens, press feedback, hover guarded to real hover devices,
   `content-visibility` on off-screen media, view transitions between routes.
5) **Mark:** per property, a real drawn mark, never a letter in a box.

The layout language is shared so the properties read as a family. The accent and the mark
are what make each one itself.

## The verification harness

**This is most of the value and it travels with the kit.** Bluebill's checks become
`stay-kit verify`, run by every property:

1) Hero fill across 13 geometries, asserting the hero reaches the fold and the primary CTA
   stays above it. Landscape phone included, because that is the row that breaks.
2) The geometry matrix on every route: no sideways scroll, no clipped text, no sub-44px
   targets, zero console errors.
3) axe across every route, zero violations.
4) The interaction sweep: drive every control, both widths, outward sends intercepted.
5) Throttled mobile performance, reporting LCP, CLS and weight rather than blocking.
6) The naming guard, which fails the build on the banned word in anything new and reports
   pre-existing occurrences as debt.
7) No em dashes in any client-facing string.

## Bluebill migrates onto the kit

Non-negotiable, and it is the proof the abstraction is right. Bluebill moves to the kit on
a branch, and parity is proven with the same harness before it merges: the same 13 of 13
hero rows, 52 of 52 geometry checks, 0 axe violations, 40 interactions.

If the migration needs a shape the kit cannot express, the kit is wrong and gets fixed.
That is the point of doing it second rather than assuming.

## Lincoln, the first new build

**243 Lincoln Ave Units 1 to 3, Cliffside Park NJ 07010.** Owner Jamarber Dobrushi.
Operator Palisade Stays.

Facts held today:

1) Three units: #1 is 1 bed, #2 is 2 bed, #3 is 3 bed.
2) Current rents: #1 $2,995, #2 $3,695, #3 $3,950 a month.
3) **Unit 2 frees on 2026-08-21** and must re-let. Unit 3 runs to 2026-10-07, then month to
   month. Unit 1 is tenanted.
4) Reserved parking is included in the rent at Unit 3, to confirm for the others.
5) Rent routes to the owner's Zelle directly. Palisade does not collect it, so the site must
   not imply an online rent payment.
6) There is no condominium association and no board approval. The `apply` module carries an
   application, a lease and a deposit instead.
7) Tenant placement carries a 10% fee, effective 2026-07-02 for all future tenants.

Audience, all of them and they share one situation: **life moved and they need somewhere
real to live for a few months.** Corporate and relocation tenants near Manhattan, insurance
and displacement placements, remote workers wanting comfortable temporary housing, and
local renters between homes. The spine is that single sentence, not four separate pitches.

Open before build: photographs (none in the repo yet), the walk and drive times to the
Manhattan crossings, what each rent includes, and the accent and mark, which get their own
short design gate.

## What this spec does not do

1) No calendar integration. Availability is hand-maintained, shaped to accept a feed later.
2) No page per unit. Deferred until a property has enough units to justify it.
3) No CMS. Content is TypeScript in the property repo, type-checked at build.
4) No payment collection. Bluebill uses a secure link, Lincoln routes to the owner directly,
   and neither is the kit's business.

## Success criteria

1) `stay-kit verify` passes on Bluebill with the same numbers it passes with today.
2) Lincoln ships from a content file plus photographs, with no new components written.
3) Adding a third property requires no change to the kit.
4) A typography fix made in the kit reaches both properties by bumping one pinned ref.
5) A credential cannot be rendered on a public route. Enforced by types, not by discipline.
