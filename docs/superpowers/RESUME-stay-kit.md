---
status: shipped, first property live on the kit
---

# Resume: stay-kit, one property-site system

**Working dir:** `/Users/macbook/Claude/stay-kit` (new repo, `main`, 7 commits, no remote yet)
**Saved:** 2026-08-16

## Status

The kit works and 243 Lincoln Avenue is live on it, verified by the kit's own
harness. The repo is PUBLIC at github.com/jakejjlee/stay-kit (Jake's call, so
Vercel's build machine can install it). Bluebill is untouched and still live on
its own code; migrating it is the one task left.

**Lincoln, live and public:** https://lincoln-pxeno2yf3-iser-labs.vercel.app
(/, /apply, /guidebook)

```
PASS naming · PASS secrets · PASS hero 13/13
PASS geometry 39/39 · PASS accessibility 0 violations
LCP 904ms to 1716ms, CLS under 0.002, ~188KB
```

Lincoln is one content file plus three lines of app composition. No new
components were written for it after the blocks existed.

**Spec:** `docs/superpowers/specs/2026-08-16-stay-kit-design.md`
**Plan:** `docs/superpowers/plans/2026-08-16-stay-kit.md`

## The gate (locked, do not re-ask)

Three interrogation rounds. Jake picked every recommended option, plus two of
his own:

1) Shared package with thin property repos. Not a fork per property.
2) One page per property, units as a comparison section.
3) Availability hand-maintained in the content file, shaped to take a feed later.
4) Extract the kit first, then Lincoln as the proof.
5) Shared bones, per-property accent and mark.
6) All four proposed modules, plus a qualifying inquiry, an arrival pack, and
   (Jake's own pick, against my recommendation to defer) a soft hold.
7) Arrival pack behind an unguessable per-booking link.
8) Any property, any operator. The operator is a content field.
9) Lincoln's audience is all four: corporate and relocation, insurance
   placement, remote workers, local renters between homes. One spine: life
   moved and they need somewhere real to live for a few months.

## Built and verified

**47 unit tests pass. Typecheck clean.**

1) `src/content/types.ts` The content model. Units are an array, so one unit and
   three cost the same. A credential is a `Secret`, an opaque box that React
   cannot render, a template literal cannot interpolate, and whose value sits
   behind a non-enumerable symbol so a spread or JSON.stringify never sees it.
2) `src/content/validate.ts` Reports every problem at once. Refuses a secret
   declared outside `arrival`, an invalid timezone, a non-ISO date, duplicate
   unit ids, and an em dash anywhere in copy.
3) `src/lib/dates.ts` `formatDate` takes no timezone on purpose: a lease end
   date is a calendar date, not an instant. A test caught the first version
   rendering the 21st as the 22nd in Auckland.
4) `src/styles/` Split from Bluebill's stylesheet at the same 293 rules. Every
   literal accent routes through four tokens, hand-written alphas became
   `color-mix`, so a property sets two values.
5) `src/components/` Nine components, every property fact now a prop. Nav links,
   wordmark, phone and unit number were hardcoded to Bluebill.
6) `src/blocks/UnitsTable.tsx` One unit renders as a card, many as a comparison.
7) `src/modules/guidebook`, `src/modules/arrival` Built. Arrival is the only
   file allowed to open a secret box, enforced by the harness.
8) `src/lib/{token,hold}.ts` 32-byte tokens. The hold refuses to render when
   Upstash is absent rather than showing a button that does nothing.
9) `harness/` + `bin/stay-kit.mjs` The whole verification suite as a CLI.

## Every check proven to fail on purpose

Three needed correcting during the port, which is the point of proving them:

1) **Geometry** flagged inline text links. WCAG 2.2 SC 2.5.8 explicitly exempts
   a link flowing inside a sentence. Fixed, and off-screen honeypots and skip
   links are exempt too.
2) **Naming** flagged itself, because the file contains the string it searches
   for. Now assembled from fragments, and the scan is scoped to `src`.
3) **Accessibility** reported a contrast failure that does not exist: axe was
   sampling mid-crossfade on the hero slideshow. Now waits for settle and fonts.
   Three consecutive runs return 0 violations across all four routes.

Measured against live Bluebill production:

```
PASS  naming
PASS  secrets      no declared secret on any public route
PASS  hero         13 of 13 geometries
PASS  geometry     13 of 13 checks
PASS  a11y         0 violation nodes across 4 routes
INFO  perf         / LCP 2900ms  CLS 0  ~461KB / 19 req
```

The secrets check is proven both directions: it fails on a string genuinely in
the HTML, and passes with the real gate code and wifi password.

## Bugs the build found, worth remembering

1) **The accent did nothing.** The block layer references `--emerald` in 35
   places, so a property setting `--accent` rendered in the first property's
   green. Caught by looking at the deployed page, not by any test. The legacy
   names are now aliases of the accent.
2) **A `link:` dependency does not exist on the build machine.** The first two
   deploys failed. Pinning by git ref is the only thing that works, and the
   repo had to be public for the builder to fetch it.
3) **Vercel serves a holding page for a failed deploy, and it returns 200.** I
   reported those 200s as a pass before checking the body. Status codes are not
   evidence; the content is.
4) **The nav advertised a route that did not exist**, so Next prefetched
   `/apply` into a 404. A module listed in content must have a route.
5) **The footer used a light-surface text token on a dark background**, 2.53:1.

## Not started

**Task 9, migrate Bluebill onto the kit.** Needs the remaining modules first:
`marketing`, `units`, `rates`, `apply`, `rules`, `inquiry`, `hold`. The
guidebook and arrival modules are done and are the pattern to follow. Bluebill's
`app/page.tsx` is 669 lines and becomes a composition of blocks. Do this on a
branch, and merge only when `stay-kit verify` matches production exactly. If a
number is worse, the kit is wrong, not the property.

**Task 10, build 243 Lincoln Ave.** Three units at Cliffside Park NJ 07010,
owner Arber Dobrushi, operator Palisade Stays. Unit 1 $2,995 leased, Unit 2
$3,695 free from 2026-08-21, Unit 3 $3,950 leased to 2026-10-07. No association
and no board approval, so `approvalLeadDays` stays undefined and the apply
module renders without a deadline. Rent routes to the owner's Zelle, so no copy
may imply an online rent payment. Tenant placement carries a 10% fee.

## Blockers for Lincoln

1) **No photographs exist** in any repo. `photos: []` renders a marked slot.
   Do not substitute Bluebill's and do not generate any.
2) **No accent or mark chosen.** Needs a short design gate of its own.
3) **Unit 2 is empty from 21 August**, five days out. The kit will not be
   finished and Lincoln live before then. If leads matter more than the
   architecture, a single honest page for Unit 2 is about an hour of work.

## Next action

Build the remaining seven modules, then Task 9. The guidebook module is the
template to copy.
