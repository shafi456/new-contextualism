/**
 * The search index, generated at build time from every collection. Searching
 * happens in the visitor's browser; nothing is sent to a server.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { listed, registry } from '../lib/content';
import { displayName, stripMarkdown } from '../lib/format';
import { EVENT_TYPE_LABELS, STATUS_LABELS, TYPE_LABELS } from '../lib/provenance';
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

export const GET: APIRoute = async () => {
  const reg = await registry();
  const pages = await getCollection('pages');
  const out: Entry[] = [
    {
      t: 'The Movement',
      u: url('/movement/'),
      k: 'Section',
      s: 'What New Contextualism is, its principles as they have been formulated, its origins and its proposed mission.',
      b: '',
      x: 'movement principles origins chronology mission vision new contextualism 2.0',
    },
    {
      t: 'Philosophy',
      u: url('/philosophy/'),
      k: 'Section',
      s: 'The philosophy in depth: origins, the limits of physical context, the ten dimensions, applications and critique.',
      b: '',
      x: 'philosophy theory critique bibliography',
    },
    {
      t: 'Framework',
      u: url('/framework/'),
      k: 'Section',
      s: 'The ten contextual dimensions and the relations between them, in an interactive diagram.',
      b: '',
      x: 'framework dimensions diagram matrix relations tenfold',
    },
    {
      t: 'Projects',
      u: url('/projects/'),
      k: 'Section',
      s: 'Conceptual proposals and ongoing research in which the framework has been applied.',
      b: '',
      x: 'projects theses studio competition research',
    },
    {
      t: 'Research',
      u: url('/research/'),
      k: 'Section',
      s: 'The archive of essays, lectures, reports and earlier scholarship, with filters.',
      b: '',
      x: 'research archive publications essays lectures',
    },
    {
      t: 'About',
      u: url('/about/'),
      k: 'Section',
      s: 'The platform, the founder and the people who have contributed to the public record.',
      b: '',
      x: 'about founder contributors platform',
    },
    {
      t: 'Dialogue and events',
      u: url('/dialogue/'),
      k: 'Section',
      s: 'Research contributions, collaborations, lectures, calls for papers, workshops and events.',
      b: '',
      x: 'dialogue community events workshop symposium calls for papers',
    },
  ];

  for (const d of reg.dimensions)
    out.push({
      t: d.data.name,
      u: url(`/framework/${d.id}/`),
      k: 'Dimension',
      s: d.data.summary,
      b: clip(`${stripMarkdown(d.body ?? '')} ${d.data.questions.join(' ')}`),
      x: d.data.keywords.join(' '),
    });

  for (const s of reg.philosophy)
    out.push({
      t: s.data.title,
      u: url(`/philosophy/#${s.id.replace(/^\d+-/, '')}`),
      k: 'Philosophy',
      s: '',
      b: clip(stripMarkdown(s.body ?? '')),
      x: '',
    });

  for (const p of listed(reg.projects)) {
    const d = p.data;
    out.push({
      t: d.title,
      u: url(`/projects/${p.id}/`),
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
      u: url(`/research/${p.id}/`),
      k: TYPE_LABELS[d.type],
      s: d.summary ?? '',
      b: clip(stripMarkdown(p.body ?? '')),
      x: [...d.authors, ...d.editors].map(displayName).concat(d.venue ?? '', d.topics, reg.labels.get(p.id) ?? '').join(' '),
    });
  }

  for (const e of reg.events)
    out.push({
      t: e.data.title,
      u: url(`/dialogue/#${e.id}`),
      k: EVENT_TYPE_LABELS[e.data.type],
      s: e.data.summary,
      b: clip(stripMarkdown(e.body ?? '')),
      x: [...e.data.participants.map((p) => p.name), ...e.data.programme.map((p) => `${p.title} ${p.speaker ?? ''}`), e.data.location ?? ''].join(' '),
    });

  for (const person of reg.people)
    out.push({
      t: person.data.name,
      u: url('/about/#founder'),
      k: 'Person',
      s: person.data.role,
      b: clip(stripMarkdown(person.body ?? '')),
      x: person.data.affiliations.map((a) => a.title).join(' '),
    });

  for (const page of pages)
    out.push({
      t: page.data.title,
      u: url(page.id === 'platform' ? '/about/#platform' : `/${page.id}/`),
      k: 'Page',
      s: page.data.intro ?? '',
      b: clip(stripMarkdown(page.body ?? '')),
      x: '',
    });

  return new Response(JSON.stringify(out), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
