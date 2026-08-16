import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * Two structural rules the codebase must not break.
 *
 * 1) A client naming rule: one word must never ship. Assembled from fragments
 *    so this file does not contain it. Files that carried it before the rule
 *    existed are reported as debt rather than failing the build.
 * 2) Only the arrival module may open a secret box. Enforced here so the
 *    rule is checked by CI rather than remembered by whoever edits next.
 */
const BANNED = ["col", "ony"].join("");
// Assembled the same way, so this checker is not itself a hit.
const REVEAL = ["reveal", "Secret"].join("");
const EXTS = new Set([".ts", ".tsx", ".css", ".js", ".mjs", ".txt", ".json", ".html"]);

function walk(p, out = []) {
  let s;
  try { s = statSync(p); } catch { return out; }
  if (s.isDirectory()) {
    if (p.includes("node_modules") || p.includes("/.")) return out;
    for (const e of readdirSync(p)) walk(join(p, e), out);
    return out;
  }
  if (EXTS.has(extname(p))) out.push(p);
  return out;
}

export async function run({ roots = ["src", "harness", "bin"], preexisting = [] } = {}) {
  const lines = [];
  const hits = [], debt = [], reveals = [];
  const pre = new Set(preexisting);

  for (const root of roots) {
    for (const f of walk(root)) {
      const text = readFileSync(f, "utf8");
      text.split("\n").forEach((line, i) => {
        if (line.toLowerCase().includes(BANNED)) (pre.has(f) ? debt : hits).push(`${f}:${i + 1}`);
      });
      // Only site source is scanned for this; the checker itself is tooling.
      if (f.startsWith("src") && text.includes(REVEAL) && !f.endsWith("content/types.ts") && !f.includes("modules/arrival")) {
        reveals.push(f);
      }
    }
  }

  if (debt.length) {
    lines.push(`  naming debt, pre-dates the rule, owner's call (${debt.length}):`);
    for (const d of debt) lines.push(`    ${d}`);
  }
  for (const h of hits) lines.push(`  naming rule violated: ${h}`);
  for (const r of reveals) lines.push(`  ${REVEAL} imported outside the arrival module: ${r}`);

  const pass = hits.length === 0 && reveals.length === 0;
  if (pass) lines.push(`  naming clean, and ${REVEAL} is confined to the arrival module`);
  return { pass, lines };
}
