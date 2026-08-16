import { chromium } from "playwright";

/**
 * Throttled mobile, reported not blocked. Performance is Jake's call to make
 * against the design, so this prints numbers and always passes.
 */
export async function run({ url, routes = ["/"] }) {
  const browser = await chromium.launch();
  const lines = [];

  for (const route of routes) {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 727 }, deviceScaleFactor: 2.75 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    let bytes = 0, requests = 0;
    page.on("response", async (r) => {
      requests++;
      const len = r.headers()["content-length"];
      if (len) bytes += Number(len);
    });

    try {
      await page.goto(url + route, { waitUntil: "load" });
      await page.waitForTimeout(3500);
      const m = await page.evaluate(
        () =>
          new Promise((res) => {
            let lcp = 0, cls = 0;
            new PerformanceObserver((l) => { const e = l.getEntries().pop(); if (e) lcp = Math.round(e.startTime); })
              .observe({ type: "largest-contentful-paint", buffered: true });
            new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; })
              .observe({ type: "layout-shift", buffered: true });
            setTimeout(() => res({ lcp, cls: Math.round(cls * 10000) / 10000 }), 600);
          }),
      );
      lines.push(
        `  ${route.padEnd(12)} LCP ${String(m.lcp).padStart(5)}ms  CLS ${m.cls}  ~${Math.round(bytes / 1024)}KB / ${requests} req`,
      );
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  return { pass: true, lines };
}
