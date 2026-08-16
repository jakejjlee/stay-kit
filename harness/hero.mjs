import { chromium } from "playwright";

/**
 * The hero must fill the window at every geometry, and the primary call to
 * action must stay above the fold.
 *
 * Both halves matter. A hero that falls short leaves a strip of the next
 * section showing; a hero that overflows pushes the button below the fold,
 * which is worse, and is a failure a real build had on four of these thirteen
 * rows. Landscape phone is the row that breaks; never drop it.
 */
export const GEOMETRIES = [
  ["iPhone 16 Pro", 402, 874],
  ["iPhone 16 Pro Max", 440, 956],
  ["iPhone 14", 390, 844],
  ["iPhone SE", 320, 568],
  ["iPhone landscape", 874, 402],
  ["Small Android", 360, 740],
  ["iPad portrait", 820, 1180],
  ["iPad landscape", 1180, 820],
  ["Laptop 13", 1280, 800],
  ["Large desktop", 1920, 1080],
  ["Short desktop", 1440, 700],
  ["Very short", 1440, 600],
  ["320 narrow", 320, 480],
];

export async function run({ url, heroSelector = "header.hero, .hero, header", ctaSelector = ".hero__actions .cta, .hero .cta" }) {
  const browser = await chromium.launch();
  const lines = [];
  let failing = 0;

  lines.push("| Geometry | Viewport | Hero | Fold | Fills | CTA |");
  lines.push("|---|---|---|---|---|---|");

  for (const [name, w, h] of GEOMETRIES) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    try {
      await page.goto(url, { waitUntil: "load" });
      await page.waitForTimeout(400);
      const r = await page.evaluate(
        ([hs, cs]) => {
          const hero = document.querySelector(hs);
          if (!hero) return null;
          const hb = hero.getBoundingClientRect();
          const cta = document.querySelector(cs);
          const cb = cta ? cta.getBoundingClientRect() : null;
          return {
            heroH: Math.round(hb.height),
            vh: window.innerHeight,
            ctaBottom: cb ? Math.round(cb.bottom) : null,
          };
        },
        [heroSelector, ctaSelector],
      );

      if (!r) {
        failing++;
        lines.push(`| ${name} | ${w}x${h} | no hero found | | FAIL | |`);
        continue;
      }

      // Within 2px counts as filling: sub-pixel layout rounds.
      const fills = Math.abs(r.heroH - r.vh) <= 2 || r.heroH > r.vh;
      const exact = Math.abs(r.heroH - r.vh) <= 2;
      const ctaOk = r.ctaBottom !== null && r.ctaBottom <= r.vh;
      if (!exact || !ctaOk) failing++;

      lines.push(
        `| ${name} | ${w}x${h} | ${r.heroH}px | ${r.vh}px | ${
          exact ? "PASS" : fills ? `FAIL over by ${r.heroH - r.vh}px` : `FAIL short by ${r.vh - r.heroH}px`
        } | ${ctaOk ? "PASS" : "FAIL below fold"} |`,
      );
    } finally {
      await page.close();
    }
  }

  await browser.close();
  lines.push(`  ${GEOMETRIES.length - failing} of ${GEOMETRIES.length} geometries pass`);
  return { pass: failing === 0, lines };
}
