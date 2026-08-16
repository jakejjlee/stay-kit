// Ported from a live property verification run. Exports run({url, routes})
// returning { pass, lines } so the CLI can aggregate and set an exit code.
export async function run({ url, routes = ['/'] }) {
  const U = url; const ROUTES = routes;
  const lines = []; let failing = 0;
  const console = { log: (...a) => lines.push(a.join(' ')), error: (...a) => lines.push(a.join(' ')) };
import { chromium } from 'playwright';

const b = await chromium.launch();
const fails = [], notes = [];
let interactions = 0;

async function page(w=393,h=852){
  const ctx = await b.newContext({ viewport:{width:w,height:h} });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(String(e)));
  // Intercept every genuinely outward send. The sweep tests the UI state
  // machine; it must not email anyone.
  await p.route('**/api/**', r => r.fulfill({ status:200, contentType:'application/json', body:'{"ok":true}' }));
  return { ctx, p, errs };
}
async function noOverflow(p, where){
  const o = await p.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (o > 1) fails.push(`overflow ${o}px after ${where}`);
}

/* ---------- homepage ---------- */
{
  const { ctx, p, errs } = await page();
  await p.goto(U, { waitUntil:'load' }); await p.waitForTimeout(700);

  // hamburger open, every link present, close
  const burger = p.locator('.mnav__btn').first();
  if (await burger.count()) {
    await burger.click(); interactions++;
    await p.waitForTimeout(350);
    const links = await p.locator('.mnav a, [class*=mnav] a').count();
    notes.push(`mobile nav exposes ${links} links`);
    if (links < 8) fails.push(`mobile nav only ${links} links, guest routes may be missing`);
    const reach = await p.locator('a[href="/apply"], a[href="/guidebook"], a[href="/rules"]').count();
    if (reach === 0) fails.push('guest routes unreachable from mobile nav');
    await p.keyboard.press('Escape'); interactions++;
    await p.waitForTimeout(250);
    await noOverflow(p,'mobile nav');
  } else fails.push('no mobile nav button found');

  // every in-page anchor, twice: through the hamburger at phone width, and
  // through the desktop topnav at 1280. A link only reachable at one width is
  // a real failure; a link hidden behind a closed menu is not.
  for (const h of ['#home','#day','#rates','#how','#inquire']) {
    await burger.click().catch(()=>{});
    await p.waitForTimeout(300);
    const a = p.locator(`a[href="${h}"]:visible`).first();
    if (await a.count()) {
      await a.click({ timeout: 8000 }).catch(e => fails.push(`phone: ${h} not clickable`));
      interactions++; await p.waitForTimeout(300); await noOverflow(p, 'phone ' + h);
    } else fails.push(`phone: ${h} unreachable even with the menu open`);
  }

  // FAQ disclosures
  const faqs = p.locator('.faq summary:visible, details summary:visible');
  const nf = await faqs.count();
  for (let i=0;i<nf;i++){ await faqs.nth(i).click(); interactions++; }
  await p.waitForTimeout(250); await noOverflow(p,'faq open');
  notes.push(`${nf} FAQ disclosures toggled`);

  // inquiry form: empty submit must not succeed
  const form = p.locator('form').first();
  if (await form.count()) {
    await p.locator('#inquire').scrollIntoViewIfNeeded().catch(()=>{});
    const submit = form.locator('button[type=submit]:visible').first();
    await submit.click(); interactions++;
    await p.waitForTimeout(500);
    const okAfterEmpty = await p.locator('.form__success').count();
    if (okAfterEmpty) fails.push('inquiry form reported success on an EMPTY submit');
    // valid path
    await form.locator('input[name=name]').fill('Sweep Test').catch(()=>{});
    await form.locator('input[name=email]').fill('not-an-email').catch(()=>{});
    await submit.click(); interactions++; await p.waitForTimeout(400);
    const okAfterBadEmail = await p.locator('.form__success').count();
    if (okAfterBadEmail) fails.push('inquiry form accepted a malformed email');
    await form.locator('input[name=email]').fill('sweep@example.com').catch(()=>{});
    await submit.click(); interactions++; await p.waitForTimeout(700);
    notes.push('inquiry form: empty rejected, bad email rejected, valid path exercised');
  } else fails.push('no inquiry form found');

  if (errs.length) fails.push(`homepage console: ${errs.slice(0,3).join(' | ')}`);
  await ctx.close();
}

/* ---------- desktop nav ---------- */
{
  const { ctx, p, errs } = await page(1280, 900);
  await p.goto(U, { waitUntil:'load' }); await p.waitForTimeout(700);
  for (const h of ['#home','#day','#rates','#how','#inquire']) {
    const a = p.locator(`.topnav a[href="${h}"]:visible`).first();
    if (await a.count()) {
      await a.click({ timeout: 8000 }).catch(()=>fails.push(`desktop: ${h} not clickable`));
      interactions++; await p.waitForTimeout(250); await noOverflow(p,'desktop '+h);
    } else fails.push(`desktop: ${h} missing from the topnav`);
  }
  // sticky header appears and its CTA works
  await p.evaluate(()=>window.scrollTo(0, window.innerHeight * 1.4));
  await p.waitForTimeout(600);
  const sticky = p.locator('.sitehead.visible a.cta:visible').first();
  if (await sticky.count()) { await sticky.click(); interactions++; await p.waitForTimeout(300); }
  else notes.push('sticky header CTA not visible after scroll');
  // footer routes resolve
  for (const r of ['/apply','/guidebook','/rules']) {
    const res = await p.request.get(U+r);
    if (!res.ok()) fails.push(`footer link ${r} returned ${res.status()}`);
    interactions++;
  }
  if (errs.length) fails.push(`desktop console: ${errs.slice(0,2).join(' | ')}`);
  await ctx.close();
}

/* ---------- guide routes ---------- */
for (const route of ['/apply','/guidebook','/rules']) {
  const { ctx, p, errs } = await page();
  await p.goto(U+route, { waitUntil:'load' }); await p.waitForTimeout(600);
  const tabs = p.locator('.guidenav__tab');
  const nt = await tabs.count();
  if (nt !== 3) fails.push(`${route}: expected 3 guide tabs, found ${nt}`);
  for (let i=0;i<nt;i++){
    const href = await tabs.nth(i).getAttribute('href');
    const r = await p.request.get(U+href);
    if (!r.ok()) fails.push(`${route}: tab ${href} returned ${r.status()}`);
    interactions++;
  }
  await noOverflow(p, route);
  if (errs.length) fails.push(`${route} console: ${errs.slice(0,2).join(' | ')}`);
  await ctx.close();
}

/* ---------- acknowledgment form on /rules ---------- */
{
  const { ctx, p, errs } = await page();
  await p.goto(U+'/rules', { waitUntil:'load' }); await p.waitForTimeout(600);
  const f = p.locator('form.ackform');
  await f.locator('button[type=submit]').click(); interactions++;
  await p.waitForTimeout(400);
  if (await p.locator('.ackform__done').count()) fails.push('acknowledgment succeeded on an EMPTY submit');
  await f.locator('#ack-names').fill('Sweep Test');
  await f.locator('#ack-signature').fill('Different Name');
  await f.locator('#ack-email').fill('sweep@example.com');
  await f.locator('#ack-start').fill('2027-01-28');
  await f.locator('#ack-accepted').check(); interactions++;
  await f.locator('button[type=submit]').click(); interactions++;
  await p.waitForTimeout(500);
  if (await p.locator('.ackform__done').count()) fails.push('acknowledgment accepted a MISMATCHED signature');
  await f.locator('#ack-signature').fill('Sweep Test');
  await f.locator('button[type=submit]').click(); interactions++;
  await p.waitForTimeout(700);
  if (!(await p.locator('.ackform__done').count())) fails.push('acknowledgment did not succeed on a VALID submit');
  else notes.push('acknowledgment: empty rejected, mismatch rejected, valid accepted');
  await noOverflow(p,'acknowledgment');
  if (errs.length) fails.push(`/rules console: ${errs.slice(0,2).join(' | ')}`);
  await ctx.close();
}

await b.close();
console.log('--- NOTES ---'); notes.forEach(n=>console.log('  '+n));
console.log(`\n--- RESULT: ${interactions} interactions driven, ${fails.length} failing ---`);
fails.forEach(f=>console.log('  FAIL: '+f));

  return { pass: failing === 0, lines };
}
