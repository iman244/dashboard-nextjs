/**
 * Print the resolved <title>, meta description and robots for every route, in
 * both locales.
 *
 * Unlike check-messages.mjs this is NOT static: metadata is resolved by Next at
 * request time, and the title template is only visible once a page renders. So
 * it needs the dev server running:
 *
 *   npm run dev
 *   node scripts/check-metadata.mjs
 *
 * What it is for: catching a title that lost the product suffix, a description
 * that never got written, or an authenticated route that forgot to say noindex.
 */
const BASE = 'http://localhost:3000';

const ROUTES = [
  '',
  '/authentication',
  '/patient/sign-in',
  '/patient/records',
  '/console',
  '/console/electronic-health-record',
  '/console/periodical-reports',
  '/console/patient-reports',
  '/console/saderat-bank-health-monitoring',
  '/console/saderat-bank-health-monitoring/step-1/7',
  '/console/saderat-bank-health-monitoring/step-2/7',
  '/console/saderat-bank-health-monitoring/step-2/7/849290351',
  '/console/form-sabt-payesh',
  '/form-sabt-payesh',
  '/loading',
  '/auth-authenticated',
  '/console-unauthenticate',
];

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : null;
};

for (const locale of ['fa', 'en']) {
  console.log(`\n${'='.repeat(78)}\n${locale.toUpperCase()}\n${'='.repeat(78)}`);
  for (const route of ROUTES) {
    const url = `${BASE}/${locale}${route}`;
    let html;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      html = await res.text();
    } catch (e) {
      console.log(`  ${route || '/'}  FETCH FAILED ${e.message}`);
      continue;
    }
    const title = pick(html, /<title[^>]*>([^<]*)<\/title>/);
    const desc = pick(html, /<meta name="description" content="([^"]*)"/);
    const robots = pick(html, /<meta name="robots" content="([^"]*)"/);
    const flag = !title || /^(Console|Authentication|Electronic Health Record|Infirmary Dashboard)$/.test(title) && locale === 'fa'
      ? ' <-- CHECK'
      : '';
    console.log(`  ${(route || '/').padEnd(58)}`);
    console.log(`      title : ${title}${flag}`);
    console.log(`      desc  : ${desc ?? '(none)'}`);
    if (robots) console.log(`      robots: ${robots}`);
  }
}
