/**
 * The search index, generated at build time from every page of the site
 * structure and every collection. Searching happens in the visitor's browser;
 * nothing is sent to a server.
 */
import type { APIRoute } from 'astro';
import { listed, registry } from '../lib/content';
import { displayName, slugify, stripMarkdown } from '../lib/format';
import { EVENT_TYPE_LABELS, STATUS_LABELS, TYPE_LABELS } from '../lib/provenance';
import { HOME, PLATFORM, SECTIONS, UTILITIES, isOverview } from '../lib/ia';
import { glossary } from '../lib/site';
import { to } from '../lib/routes';
import { url } from '../lib/url';

interface Entry {
  t: string;
  u: string;
  k: string;
  s: string;
  b: string;
  x: string;
}

const clip = (s: string, n = 1200) => (s.length > n ? `${s.slice(0, n)}…` : s);
// Module markers and callout markers are not part of the text.
const text = (md: string | undefined) => stripMarkdown((md ?? '').replace(/<!--[\s\S]*?-->/g, ' ').replace(/\[!(PENDING|NOTE)\]/g, ' '));

export const GET: APIRoute = async () => {
  const reg = await registry();
  const out: Entry[] = [];

  out.push({ t: 'Home', u: url('/'), k: 'Page', s: HOME.summary, b: '', x: HOME.pages.map((p) => p.title).join(' ') });

  for (const s of SECTIONS) {
    for (const p of s.pages) {
      const page = reg.page.get(p.path);
      const overview = isOverview(s, p) && p.title === 'Overview';
      out.push({
        t: overview ? s.title : p.title,
        u: url(p.path),
        k: s.title,
        s: page?.data.intro ?? p.summary,
        b: clip(text(page?.body)),
        x: (p.items ?? []).join(' '),
      });
    }
  }
  for (const p of [...UTILITIES, ...PLATFORM]) {
    const page = reg.page.get(p.path);
    out.push({ t: p.title, u: url(p.path), k: PLATFORM.includes(p) ? 'Platform' : 'Utility', s: page?.data.intro ?? p.summary, b: clip(text(page?.body)), x: (p.items ?? []).join(' ') });
  }

  for (const d of reg.dimensions)
    out.push({
      t: d.data.name,
      u: to.layer(d.id),
      k: 'Contextual layer',
      s: d.data.summary,
      b: clip(`${stripMarkdown(d.body ?? '')} ${d.data.questions.join(' ')}`),
      x: d.data.keywords.join(' '),
    });

  for (const p of listed(reg.projects)) {
    const d = p.data;
    out.push({
      t: d.title,
      u: to.project(p.id),
      k: STATUS_LABELS[d.status],
      s: d.summary,
      b: clip(stripMarkdown([d.context, d.historical, d.social, d.cultural, d.ecological, d.process, d.response, d.outcomes].filter(Boolean).join(' '))),
      x: [d.location, d.kind, ...d.team.map((t) => t.name)].join(' '),
    });
  }

  for (const p of listed(reg.publications)) {
    const d = p.data;
    out.push({
      t: d.title,
      u: to.record(p.id),
      k: TYPE_LABELS[d.type],
      s: d.summary ?? '',
      b: clip(stripMarkdown(p.body ?? '')),
      x: [...d.authors, ...d.editors].map(displayName).concat(d.venue ?? '', d.topics, reg.labels.get(p.id) ?? '').join(' '),
    });
  }

  for (const e of reg.events)
    out.push({
      t: e.data.title,
      u: to.event(e.id),
      k: EVENT_TYPE_LABELS[e.data.type],
      s: e.data.summary,
      b: clip(stripMarkdown(e.body ?? '')),
      x: [...e.data.participants.map((p) => p.name), ...e.data.programme.map((p) => `${p.title} ${p.speaker ?? ''}`), e.data.location ?? ''].join(' '),
    });

  for (const person of reg.people)
    out.push({
      t: person.data.name,
      u: to.founder(),
      k: 'Person',
      s: person.data.role,
      b: clip(stripMarkdown(person.body ?? '')),
      x: person.data.affiliations.map((a) => a.title).join(' '),
    });

  for (const g of glossary)
    out.push({
      t: g.term,
      u: `${url('/glossary/')}#${slugify(g.term)}`,
      k: 'Glossary',
      s: clip(stripMarkdown(g.definition), 220),
      b: '',
      x: '',
    });

  return new Response(JSON.stringify(out), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
