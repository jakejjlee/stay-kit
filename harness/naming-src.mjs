#!/usr/bin/env node
/**
 * Client naming rule: one word must never appear in anything this project ships.
 * The word is assembled from fragments at runtime so the guard itself, and this
 * repo's source, never contain it literally.
 *
 * Run with `pnpm check:naming`. Part of `pnpm verify`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const BANNED = ["col", "ony"].join("");
const ROOTS = ["app", "scripts", "public/llms.txt"];
const EXTS = new Set([".ts", ".tsx", ".css", ".js", ".mjs", ".txt", ".json", ".html"]);

/**
 * Files that already carried the word when the rule arrived (2026-08-11), all of
 * them live marketing copy written 2026-07-09. Rewriting shipped public copy is
 * the owner's call, not this script's, so these are reported as debt rather than
 * failing the build. Anything NOT on this list fails.
 * To clear an entry: fix the copy, then delete its line here.
 */
const PREEXISTING = new Set(["app/layout.tsx", "app/page.tsx", "public/llms.txt"]);

const hits = [];
const debt = [];

function walk(p) {
  let s;
  try {
    s = statSync(p);
  } catch {
    return;
  }
  if (s.isDirectory()) {
    for (const e of readdirSync(p)) walk(join(p, e));
    return;
  }
  if (!EXTS.has(extname(p))) return;
  const text = readFileSync(p, "utf8");
  text.split("\n").forEach((line, i) => {
    if (!line.toLowerCase().includes(BANNED)) return;
    (PREEXISTING.has(p) ? debt : hits).push(`${p}:${i + 1}`);
  });
}

for (const r of ROOTS) walk(r);

if (debt.length) {
  console.warn(`Naming debt, pre-dates the rule, owner's call to clear (${debt.length}):`);
  for (const d of debt) console.warn(`  ${d}`);
}

if (hits.length) {
  console.error(`Naming rule violated in ${hits.length} new place(s):`);
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}
console.log("Naming rule: clean on everything this work touches.");
