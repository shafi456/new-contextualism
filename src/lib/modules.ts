/**
 * Modules: components that a page's Markdown can embed, each written as an
 * HTML comment on a line of its own, for example
 *
 *   <!-- module: records collection="new-contextualism" type="lecture" -->
 *
 * The page body is split at each marker. Markdown is rendered as usual and
 * each module by its component in src/components/modules/. An unknown module
 * or attribute fails the build, so a typing error cannot ship silently.
 */
import { citedKeys } from './markdown';
import { chronology, faq, glossary, relations } from './site';
import type { Registry } from './content';

/** Each module and the attributes it accepts. */
export const MODULES = {
  'section-index': ['section'],
  chronology: [],
  'layer-grid': [],
  'layer-table': [],
  'layer-index': [],
  'context-diagram': [],
  'context-network': [],
  'relation-matrix': [],
  scales: [],
  process: [],
  formulations: [],
  pillars: [],
  'focus-areas': [],
  statements: [],
  projects: ['filter', 'category', 'status', 'empty'],
  'project-legend': [],
  'project-browser': [],
  'project-map': [],
  records: ['collection', 'type', 'topic', 'empty', 'compact'],
  archive: [],
  bibliography: ['collection', 'grouped'],
  lectures: [],
  events: ['type', 'empty'],
  contributors: [],
  founder: [],
  citation: [],
  downloads: ['group'],
  glossary: [],
  faq: [],
  sitemap: [],
  feed: [],
  contact: [],
  'provenance-legend': [],
  provenance: ['kind', 'note', 'approval'],
} as const satisfies Record<string, readonly string[]>;

export type ModuleName = keyof typeof MODULES;

export type Segment =
  | { kind: 'md'; text: string }
  | { kind: 'module'; name: ModuleName; attrs: Record<string, string> };

const MARKER = /^[ \t]*<!--\s*module:\s*([a-z-]+)((?:\s+[a-z-]+="[^"]*")*)\s*-->[ \t]*$/gm;
const ATTR = /([a-z-]+)="([^"]*)"/g;

export function parseModules(body: string | undefined, where: string): Segment[] {
  const src = body ?? '';
  const out: Segment[] = [];
  let last = 0;
  for (const m of src.matchAll(MARKER)) {
    const name = m[1];
    if (!(name in MODULES)) throw new Error(`${where}: unknown module "${name}"`);
    const allowed: readonly string[] = MODULES[name as ModuleName];
    const attrs: Record<string, string> = {};
    for (const [, key, value] of (m[2] ?? '').matchAll(ATTR)) {
      if (!allowed.includes(key)) throw new Error(`${where}: module "${name}" has no attribute "${key}"`);
      attrs[key] = value;
    }
    const text = src.slice(last, m.index);
    if (text.trim()) out.push({ kind: 'md', text });
    out.push({ kind: 'module', name: name as ModuleName, attrs });
    last = (m.index ?? 0) + m[0].length;
  }
  const rest = src.slice(last);
  if (rest.trim()) out.push({ kind: 'md', text: rest });
  return out;
}

/** Events of the given types (comma-separated), or all events, excluding archived ones. */
export function eventsFor(reg: Registry, types?: string) {
  const list = types?.split(',').map((t) => t.trim()).filter(Boolean) ?? [];
  return reg.events.filter((e) => !e.data.archived && (!list.length || list.includes(e.data.type)));
}

/** The second-level headings of a page body, as written. */
export function headings(body: string | undefined): string[] {
  return [...(body ?? '').matchAll(/^##[ \t]+(.+?)[ \t]*#*[ \t]*$/gm)].map((m) => m[1]);
}

/**
 * Records that a module cites, so that the page's bibliography can be built
 * before anything is rendered.
 */
export function moduleCitations(reg: Registry, s: Extract<Segment, { kind: 'module' }>): string[] {
  const DS = 'reza-2025-deltaic-bangladesh';
  const TBS = 'reza-2023-new-contextualism-path';
  const CBD = 'reza-nitu-2025-people-place-justice';
  switch (s.name) {
    case 'chronology':
      return chronology.flatMap((c) => c.sources);
    case 'layer-table':
      return [...new Set(reg.dimensions.map((d) => d.data.keywordsSource))];
    case 'context-diagram':
      return [DS, ...relations.flatMap((r) => (r.source ? [r.source] : []))];
    case 'relation-matrix':
      return relations.flatMap((r) => (r.source ? [r.source] : []));
    case 'scales':
      return [TBS];
    case 'process':
      return [CBD];
    case 'formulations':
      return ['bracu-2023-workshop-report', DS, CBD];
    case 'pillars':
      return [CBD];
    case 'focus-areas':
      return [DS, 'united-nations-2015-agenda-2030'];
    case 'lectures': {
      const person = reg.people.find((p) => p.id === 'mohammad-habib-reza');
      return person?.data.presentations.map((x) => x.source) ?? [];
    }
    case 'events':
      return eventsFor(reg, s.attrs.type).flatMap((e) => [...e.data.sources, ...citedKeys(e.body)]);
    case 'founder': {
      const person = reg.people.find((p) => p.id === 'mohammad-habib-reza');
      if (!person) return [];
      const d = person.data;
      return [
        ...[...d.appointments, ...d.education, ...d.affiliations, ...d.presentations].map((x) => x.source),
        ...citedKeys(person.body),
      ];
    }
    case 'glossary':
      return glossary.flatMap((g) => citedKeys(g.definition));
    case 'faq':
      return faq.flatMap((f) => citedKeys(f.answer));
    default:
      return [];
  }
}
