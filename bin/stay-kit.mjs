#!/usr/bin/env node
/**
 * stay-kit verify --url <origin> --routes /,/apply,/guidebook
 *
 * Blocking checks decide the exit code. Performance reports its numbers and
 * never blocks, because that trade is the owner's to make against the design.
 *
 * Secret values come from STAY_KIT_SECRETS at run time, never from a file in
 * the repo. Without it, the leak check says so rather than passing quietly.
 */
import { run as naming } from "../harness/naming.mjs";
import { run as secrets } from "../harness/secrets.mjs";
import { run as hero } from "../harness/hero.mjs";
import { run as geo } from "../harness/geo.mjs";
import { run as a11y } from "../harness/a11y.mjs";
import { run as perf } from "../harness/perf.mjs";

const argv = process.argv.slice(2);
const command = argv[0] ?? "verify";

function flag(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}

if (command !== "verify") {
  console.error(`Unknown command "${command}". The only command is: verify`);
  process.exit(2);
}

const url = flag("url");
if (!url) {
  console.error("stay-kit verify --url <origin> [--routes /,/apply] [--skip hero,a11y]");
  process.exit(2);
}
const routes = flag("routes", "/").split(",");
const skip = new Set(flag("skip", "").split(",").filter(Boolean));
const declared = (process.env.STAY_KIT_SECRETS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const BLOCKING = [
  ["naming", () => naming({})],
  ["secrets", () => secrets({ url, routes, secrets: declared })],
  ["hero", () => hero({ url })],
  ["geometry", () => geo({ url, routes })],
  ["accessibility", () => a11y({ url, routes })],
];

console.log(`stay-kit verify\n  ${url}\n  ${routes.length} route(s): ${routes.join(" ")}\n`);

let failed = 0;
for (const [name, fn] of BLOCKING) {
  if (skip.has(name)) {
    console.log(`SKIP  ${name}`);
    continue;
  }
  let result;
  try {
    result = await fn();
  } catch (err) {
    // A check that cannot run is a failure, never a pass.
    result = { pass: false, lines: [`  the check itself threw: ${err.message}`] };
  }
  console.log(`${result.pass ? "PASS" : "FAIL"}  ${name}`);
  for (const l of result.lines) if (l) console.log(l);
  if (!result.pass) failed++;
}

if (!skip.has("perf")) {
  const p = await perf({ url, routes }).catch((e) => ({ lines: [`  could not measure: ${e.message}`] }));
  console.log("INFO  performance, throttled mobile (1.6Mbps, 4x CPU)");
  for (const l of p.lines) if (l) console.log(l);
}

console.log(failed ? `\n${failed} blocking check(s) failed.` : "\nAll blocking checks passed.");
process.exit(failed ? 1 : 0);
