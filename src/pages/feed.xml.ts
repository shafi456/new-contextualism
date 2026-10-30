/**
 * An Atom feed of new records and events (/feed.xml): the way to follow the
 * platform until a newsletter exists. Feed readers poll it; nothing about the
 * reader is collected.
 */
import type { APIRoute } from 'astro';
import { archiveRecords, registry } from '../lib/content';
import { escapeHtml, formatDate } from '../lib/format';
import { EVENT_TYPE_LABELS, TYPE_LABELS } from '../lib/provenance';
import { settings } from '../lib/site';
import { url } from '../lib/url';
import { pubYear } from '../lib/cite';

export const GET: APIRoute = async ({ site }) => {
  const reg = await registry();
  const abs = (path: string) => (site ? new URL(url(path), site).href : url(path));
  const entries = [
    ...archiveRecords(reg).map((p) => ({
      id: abs(`/research/${p.id}/`),
      title: p.data.title,
      date: p.data.date ?? new Date(Date.UTC(pubYear(p) ?? 2000, 0, 1)),
      kind: TYPE_LABELS[p.data.type],
      summary: p.data.summary ?? '',
    })),
    ...reg.events
      .filter((e) => !e.data.archived)
      .map((e) => ({
        id: abs(`/community/events/#${e.id}`),
        title: e.data.title,
        date: e.data.start,
        kind: `${EVENT_TYPE_LABELS[e.data.type]}, ${formatDate(e.data.start)}`,
        summary: e.data.summary,
      })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 40);
  const updated = entries[0]?.date ?? new Date(0);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-GB">
  <title>${escapeHtml(settings.title)}: new records and events</title>
  <subtitle>${escapeHtml(settings.description)}</subtitle>
  <id>${abs('/feed.xml')}</id>
  <link rel="self" href="${abs('/feed.xml')}"/>
  <link rel="alternate" href="${abs('/')}"/>
  <updated>${updated.toISOString()}</updated>
  <author><name>${escapeHtml(settings.title)} (editors)</name></author>
${entries
  .map(
    (e) => `  <entry>
    <title>${escapeHtml(e.title)}</title>
    <id>${e.id}</id>
    <link href="${e.id}"/>
    <updated>${e.date.toISOString()}</updated>
    <category term="${escapeHtml(e.kind)}"/>
    <summary>${escapeHtml(e.summary)}</summary>
  </entry>`,
  )
  .join('\n')}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
