// Rewrites src/content/site/visibility.json (the publishing list in the editorial interface) from the site
// structure in src/lib/ia.ts, keeping every status already set. Run it after adding, moving or removing a page:
//   npm run sync:visibility
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const ia = fs.readFileSync(path.join(root, 'src/lib/ia.ts'), 'utf8');
const file = path.join(root, 'src/content/site/visibility.json');
const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).sections : [];
const prev = new Map();
for (const s of old) { if (s.path) prev.set(s.path, s); for (const p of s.pages || []) prev.set(p.path, p); prev.set('group:' + s.title, s); }
const keep = (key) => { const o = prev.get(key); return { status: o?.status ?? 'published', ...(o?.publishAt ? { publishAt: o.publishAt } : {}) }; };

const region = (from, to) => ia.slice(ia.indexOf(from), to ? ia.indexOf(to) : undefined);
const pairs = (src) => {
  const out = []; let title;
  for (const m of src.matchAll(/\btitle: '([^']*)'|\bpath: '([^']*)'/g)) {
    if (m[1] !== undefined) title = m[1]; else { out.push({ title, path: m[2] }); title = undefined; }
  }
  return out;
};
const sections = [];
let cur;
for (const p of pairs(region('export const SECTIONS', 'export const UTILITIES'))) {
  // A section is declared before its pages; its overview page repeats the section's address.
  if (!cur || !p.path.startsWith(cur.path)) { cur = { title: p.title, path: p.path, ...keep(p.path), pages: [] }; sections.push(cur); }
  else if (p.path !== cur.path) cur.pages.push({ title: p.title, path: p.path, ...keep(p.path) });
}
const flat = (title, from, to, skip = [], own) => ({
  title, ...(own ? { path: own } : {}), ...keep('group:' + title),
  pages: pairs(region(from, to)).filter((p) => !skip.includes(p.path)).map((p) => ({ title: p.title, path: p.path, ...keep(p.path) })),
});
sections.push(flat('Utilities', 'export const UTILITIES', 'export const PLATFORM:', ['/search/']));
sections.push(flat('Platform (website information)', 'export const PLATFORM:', 'export const PLATFORM_SECTION', ['/about/'], '/about/'));
fs.writeFileSync(file, JSON.stringify({ sections }, null, 2) + '\n');
console.log(sections.map((s) => `${s.title}: ${s.pages.length}`).join('\n'));
