import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

/** axe across every route, at a phone width. Zero violations is the bar. */
export async function run({ url, routes = ["/"] }) {
  const browser = await chromium.launch();
  const lines = [];
  let total = 0;

  for (const route of routes) {
    // axe requires a page from an explicit context, not browser.newPage().
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
    const page = await ctx.newPage();
    try {
      await page.goto(url + route, { waitUntil: "load" });
      // Let entrance animations and any hero crossfade settle first. Sampling
      // mid-transition makes axe read a blended background and report a
      // contrast failure that does not exist once the page is at rest.
      await page.waitForTimeout(1600);
      await page.evaluate(() => document.fonts.ready);
      const res = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const nodes = res.violations.reduce((n, v) => n + v.nodes.length, 0);
      total += nodes;
      if (nodes) {
        for (const v of res.violations) {
          lines.push(`  ${route} [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
        }
      }
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  lines.push(`  ${total} violation node(s) across ${routes.length} route(s)`);
  return { pass: total === 0, lines };
}
