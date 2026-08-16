/**
 * Fetches every public route and asserts no declared secret appears in the
 * served HTML.
 *
 * The type system stops a credential being rendered by accident. This stops it
 * being rendered on purpose. Values come from STAY_KIT_SECRETS at verify
 * time, never from a committed file.
 */
export async function run({ url, routes, secrets }) {
  const lines = [];
  let pass = true;

  if (!secrets.length) {
    lines.push("  no secrets declared, nothing to check (set STAY_KIT_SECRETS to enable)");
    return { pass: true, lines };
  }

  for (const route of routes) {
    const res = await fetch(url + route);
    const html = await res.text();
    for (const s of secrets) {
      if (html.includes(s)) {
        pass = false;
        lines.push(`  LEAK: a declared secret appears in the HTML of ${route}`);
      }
    }
  }
  if (pass) lines.push(`  no declared secret appears on any of ${routes.length} public routes`);
  return { pass, lines };
}
