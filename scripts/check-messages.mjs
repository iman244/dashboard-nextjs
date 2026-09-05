/**
 * Resolve every t("key") call against the catalogues.
 *
 * A missing key is invisible until someone opens the page — next-intl throws at
 * render, not at build — so this walks the source instead of waiting for a click.
 *
 * Two things this has to get right, both of which it got wrong first time:
 *  - the variable->namespace map must be a null-prototype object, or every
 *    `toLocaleString("en-US")` in the tree looks like a translation call;
 *  - a file can bind the same name (`tDictionary`) to different namespaces in
 *    different components, so a key counts as found if it resolves under ANY
 *    namespace that name is bound to in that file.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const en = JSON.parse(readFileSync('messages/en.json', 'utf8'));
const fa = JSON.parse(readFileSync('messages/fa.json', 'utf8'));

const get = (obj, path) =>
  path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(p)) out.push(p);
  }
  return out;
}

const files = walk('src');
const problems = [];
let checked = 0;

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const ns = Object.create(null); // name -> Set of namespaces
  for (const m of src.matchAll(
    /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*["'`]([^"'`]+)["'`]\s*\)/g
  )) {
    (ns[m[1]] ??= new Set()).add(m[2]);
  }
  if (!Object.keys(ns).length) continue;

  for (const m of src.matchAll(/\b(\w+)\(\s*["'`]([^"'`{}]+)["'`]/g)) {
    const [, v, key] = m;
    if (!Object.hasOwn(ns, v)) continue;
    checked++;
    const candidates = [...ns[v]].map((n) => `${n}.${key}`);
    const inEn = candidates.some((c) => get(en, c) !== undefined);
    const inFa = candidates.some((c) => get(fa, c) !== undefined);
    if (!inEn || !inFa) {
      const line = src.slice(0, m.index).split('\n').length;
      problems.push({
        file: f,
        line,
        tried: candidates.join(' | '),
        where: !inEn && !inFa ? 'MISSING in both' : !inEn ? 'MISSING in en' : 'MISSING in fa',
      });
    }
  }
}

console.log(`checked ${checked} t() calls across ${files.length} files`);
if (!problems.length) console.log('✔ every key resolves in both catalogues');
for (const p of problems) {
  console.log(`  ${p.where}  ${p.tried}`);
  console.log(`      ${p.file.replace('src/app/[locale]/(authenticated)/console/', '…/')}:${p.line}`);
}
process.exit(problems.length ? 1 : 0);
