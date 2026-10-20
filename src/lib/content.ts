/**
 * Access to the content collections, with the platform's integrity rules:
 *  - drafts never appear in production builds;
 *  - archived entries keep their pages (persistent URLs) but leave listings;
 *  - every cross-reference must resolve, or the build fails with a list of
 *    the broken references.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildLabels, pubYear, type Publication } from './cite';
import { renderInline, renderMarkdown, type CiteContext } from './markdown';
import { chronology, relations, type Relation } from './site';

export type Dimension = CollectionEntry<'dimensions'>;
export type Project = CollectionEntry<'projects'>;
export type EventEntry = CollectionEntry<'events'>;
export type PhilosophySection = CollectionEntry<'philosophy'>;
export type Person = CollectionEntry<'people'>;
export type { Publication };

const PROD = import.meta.env.PROD;
const notDraft = (e: { data: { draft?: boolean } }) => !(PROD && e.data.draft);

export interface Registry {
  dimensions: Dimension[];
  dimension: Map<string, Dimension>;
  projects: Project[];
  publications: Publication[];
  publication: Map<string, Publication>;
  labels: Map<string, string>;
  events: EventEntry[];
  event: Map<string, EventEntry>;
  philosophy: PhilosophySection[];
  people: Person[];
}

let cached: Promise<Registry> | undefined;

/** Loads and validates all content once per build. */
export function registry(): Promise<Registry> {
  if (import.meta.env.DEV) return load();
  cached ??= load();
  return cached;
}

async function load(): Promise<Registry> {
  const [dimensions, projects, publications, events, philosophy, people] = await Promise.all([
    getCollection('dimensions'),
    getCollection('projects', notDraft),
    getCollection('publications', notDraft),
    getCollection('events', notDraft),
    getCollection('philosophy'),
    getCollection('people'),
  ]);

  dimensions.sort((a, b) => a.data.number - b.data.number);
  projects.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
  publications.sort(byDateDesc);
  events.sort((a, b) => b.data.start.getTime() - a.data.start.getTime());
  philosophy.sort((a, b) => a.data.order - b.data.order);

  const reg: Registry = {
    dimensions,
    dimension: new Map(dimensions.map((d) => [d.id, d])),
    projects,
    publications,
    publication: new Map(publications.map((p) => [p.id, p])),
    labels: buildLabels(publications),
    events,
    event: new Map(events.map((e) => [e.id, e])),
    philosophy,
    people,
  };
  validate(reg);
  return reg;
}

function byDateDesc(a: Publication, b: Publication) {
  const ya = a.data.date?.getTime() ?? Date.UTC(pubYear(a) ?? 0, 0, 1);
  const yb = b.data.date?.getTime() ?? Date.UTC(pubYear(b) ?? 0, 0, 1);
  return yb - ya || a.data.title.localeCompare(b.data.title);
}

function validate(reg: Registry) {
  const errors: string[] = [];
  const dim = (id: string, where: string) => {
    if (!reg.dimension.has(id)) errors.push(`${where}: unknown dimension "${id}"`);
  };
  const src = (key: string, where: string) => {
    if (!reg.publication.has(key)) errors.push(`${where}: unknown source "${key}"`);
  };

  for (const r of relations) {
    dim(r.a, `relations ${r.id}`);
    dim(r.b, `relations ${r.id}`);
    if (r.source) src(r.source, `relations ${r.id}`);
  }
  for (const c of chronology) c.sources.forEach((k) => src(k, `chronology "${c.title}"`));
  for (const d of reg.dimensions) src(d.data.keywordsSource, `dimensions/${d.id}`);
  for (const s of reg.philosophy) if (s.data.quote) src(s.data.quote.source, `philosophy/${s.id} quote`);
  for (const p of reg.projects) {
    p.data.layers.forEach((l) => dim(l, `projects/${p.id}`));
    p.data.sources.forEach((k) => src(k, `projects/${p.id}`));
  }
  for (const p of reg.publications) {
    p.data.dimensions.forEach((l) => dim(l, `publications/${p.id}`));
    p.data.citedBy.forEach((k) => src(k, `publications/${p.id} citedBy`));
    if (p.data.event && !reg.event.has(p.data.event))
      errors.push(`publications/${p.id}: unknown event "${p.data.event}"`);
  }
  for (const e of reg.events) {
    e.data.sources.forEach((k) => src(k, `events/${e.id}`));
    e.data.programme.forEach((item) => item.record && src(item.record, `events/${e.id} programme`));
  }
  for (const person of reg.people) {
    const d = person.data;
    [...d.appointments, ...d.education, ...d.affiliations, ...d.presentations].forEach((x) =>
      src(x.source, `people/${person.id}`),
    );
  }
  if (errors.length) {
    throw new Error(`Content integrity check failed:\n  - ${errors.join('\n  - ')}`);
  }
}

/* ------------------------------------------------------------ Citations */

/**
 * A citation context for one page: renders Markdown with author–date
 * citations and remembers which records were cited, for the bibliography.
 */
export function citations(reg: Registry, where: string) {
  const cited: string[] = [];
  const ctx: CiteContext = {
    label: (key) => {
      const label = reg.labels.get(key);
      if (!label) throw new Error(`${where}: unknown citation key "${key}"`);
      return label;
    },
    onCite: (key) => {
      if (!cited.includes(key)) cited.push(key);
    },
  };
  return {
    md: (src: string | undefined) => renderMarkdown(src, ctx),
    inline: (src: string | undefined) => renderInline(src, ctx),
    /** Records a citation that is not written in Markdown (e.g. a source list). */
    add: (key: string) => {
      ctx.label(key);
      ctx.onCite?.(key);
    },
    label: (key: string) => ctx.label(key),
    cited: () => cited.slice(),
  };
}

/* ------------------------------------------------------------- Queries */

export function relationsFor(id: string): (Relation & { other: string })[] {
  return relations
    .filter((r) => r.a === id || r.b === id)
    .map((r) => ({ ...r, other: r.a === id ? r.b : r.a }));
}

export function listed<T extends { data: { archived?: boolean } }>(items: T[]): T[] {
  return items.filter((i) => !i.data.archived);
}

export function archiveRecords(reg: Registry): Publication[] {
  return listed(reg.publications).filter((p) =>
    ['new-contextualism', 'founder'].includes(p.data.collection),
  );
}

export function recordsForDimension(reg: Registry, id: string): Publication[] {
  return archiveRecords(reg).filter((p) => p.data.dimensions.includes(id));
}

export function projectsForDimension(reg: Registry, id: string): Project[] {
  return listed(reg.projects).filter((p) => p.data.layers.includes(id));
}

export function eventIsUpcoming(e: EventEntry, now = new Date()): boolean {
  const end = e.data.end ?? e.data.start;
  return end.getTime() >= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function founder(reg: Registry): Person | undefined {
  return reg.people.find((p) => p.id === 'mohammad-habib-reza');
}
