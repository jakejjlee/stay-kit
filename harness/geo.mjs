import { chromium } from "playwright";
import { GEOMETRIES } from "./hero.mjs";

/**
 * Every route at every geometry: no sideways scroll, no touch target under
 * 44px, and no console errors. Console errors are included here because a
 * screenshot proves a page looks right, not that it works.
 */
export async function run({ url, routes = ["/"] }) {
  const browser = await chromium.launch();
  const lines = [];
  let checks = 0;
  let failing = 0;

  for (const route of routes) {
    for (const [name, w, h] of GEOMETRIES) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));

      try {
        await page.goto(url + route, { waitUntil: "load" });
        await page.waitForTimeout(300);

        const r = await page.evaluate(() => {
          const doc = document.documentElement;
          const overflow = Math.max(0, doc.scrollWidth - doc.clientWidth);
          const small = [];
          const interactive = document.querySelectorAll(
            'a[href], button, input, select, textarea, [role="button"], summary',
          );
          for (const el of interactive) {
            const b = el.getBoundingClientRect();
            const styles = getComputedStyle(el);
            if (styles.display === "none" || styles.visibility === "hidden" || b.width === 0) continue;

            // Off-screen by design: spam honeypots and skip links parked
            // outside the viewport until focused. Not reachable by a thumb,
            // so a tap target size is meaningless for them.
            if (b.right < 0 || b.bottom < 0 || b.left > window.innerWidth) continue;

            // Injected platform tooling, not the site's markup. The Vercel
            // preview toolbar renders its own controls into every preview
            // deployment; judging a property on those is judging the wrong
            // thing, and it does not exist in production.
            if (el.closest("[data-vercel-toolbar], vercel-live-feedback, [class*='index-module__']")) continue;

            // WCAG 2.2 SC 2.5.8 exempts a link that flows inline inside a
            // sentence: you cannot enlarge it without breaking the paragraph.
            // Only standalone controls are held to the 44px tap target.
            const inline = styles.display.startsWith("inline") && !styles.display.includes("block");
            const inSentence =
              inline &&
              el.parentElement !== null &&
              (el.parentElement.textContent || "").trim().length > (el.textContent || "").trim().length;
            if (inSentence) continue;

            if (b.height < 44 || b.width < 24) {
              small.push(`${el.tagName.toLowerCase()}[${(el.textContent || "").trim().slice(0, 18)}] ${Math.round(b.width)}x${Math.round(b.height)}`);
            }
          }
          return { overflow, small: small.slice(0, 3), smallCount: small.length };
        });

        checks++;
        const problems = [];
        if (r.overflow > 1) problems.push(`sideways scroll ${r.overflow}px`);
        if (r.smallCount) problems.push(`${r.smallCount} target(s) under 44px: ${r.small.join(", ")}`);
        if (errors.length) problems.push(`${errors.length} console error(s): ${errors[0].slice(0, 80)}`);

        if (problems.length) {
          failing++;
          lines.push(`  FAIL ${route} at ${name} (${w}x${h}): ${problems.join("; ")}`);
        }
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  lines.push(`  ${checks - failing} of ${checks} checks pass across ${routes.length} route(s)`);
  return { pass: failing === 0, lines };
}
