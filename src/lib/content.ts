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
import { DEDICATED, STRUCTURE_PAGES, isPublic, itemId } from './ia';
import { LISTED_PATHS } from './visibility';
import { headings, parseModules } from './modules';
import { slugify } from './format';

export type Dimension = CollectionEntry<'dimensions'>;
export type Project = CollectionEntry<'projects'>;
export type EventEntry = CollectionEntry<'events'>;
export type Person = CollectionEntry<'people'>;
export type Page = CollectionEntry<'pages'>;
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
  people: Person[];
  pages: Page[];
  /** Pages by path, e.g. "/philosophy/principles/". */
  page: Map<string, Page>;
}

let cached: Promise<Registry> | undefined;

/** Loads and validates all content once per build. */
export function registry(): Promise<Registry> {
  if (import.meta.env.DEV) return load();
  cached ??= load();
  return cached;
}

async function load(): Promise<Registry> {
  const [dimensions, projects, publications, events, people, pages] = await Promise.all([
    getCollection('dimensions'),
    getCollection('projects', notDraft),
    getCollection('publications', notDraft),
    getCollection('events', notDraft),
    getCollection('people'),
    getCollection('pages'),
  ]);

  dimensions.sort((a, b) => a.data.number - b.data.number);
  projects.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
  publications.sort(byDateDesc);
  events.sort((a, b) => b.data.start.getTime() - a.data.start.getTime());

  const reg: Registry = {
    dimensions,
    dimension: new Map(dimensions.map((d) => [d.id, d])),
    projects,
    publications,
    publication: new Map(publications.map((p) => [p.id, p])),
    labels: buildLabels(publications),
    events,
    event: new Map(events.map((e) => [e.id, e])),
    people,
    pages,
    page: new Map(pages.map((p) => [p.data.path, p])),
  };
  validate(reg);
  // Checked whole, then reduced to what is published (src/lib/visibility.ts).
  reg.pages = pages.filter((p) => isPublic(p.data.path));
  reg.page = new Map(reg.pages.map((p) => [p.data.path, p]));
  reg.projects = projects.filter((p) => isPublic(`/projects/${p.id}/`));
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
  validateStructure(reg, errors);
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

/**
 * The pages must match the agreed site structure (src/lib/ia.ts): every page
 * belongs to it, every page in it exists, each page covers its sub-items as
 * second-level headings, and no record's address collides with a page.
 */
function validateStructure(reg: Registry, errors: string[]) {
  const seen = new Set<string>();
  for (const p of reg.pages) {
    const where = `pages/${p.id}`;
    const page = STRUCTURE_PAGES.find((x) => x.path === p.data.path);
    if (!page) {
      errors.push(`${where}: path ${p.data.path} is not in the site structure (src/lib/ia.ts)`);
      continue;
    }
    if (seen.has(p.data.path)) errors.push(`${where}: a second page claims ${p.data.path}`);
    seen.add(p.data.path);
    parseModules(p.body, where);
    const ids = headings(p.body).map((h) => slugify(h));
    for (const item of page.items ?? []) {
      if (!ids.includes(itemId(item))) errors.push(`${where}: missing the sub-item heading "## ${item}"`);
    }
  }
  for (const page of STRUCTURE_PAGES) {
    if (!DEDICATED.includes(page.path) && !seen.has(page.path) && !page.path.includes('#')) {
      errors.push(`site structure: no page in src/content/pages for ${page.number} ${page.title} (${page.path})`);
    }
  }
  for (const path of LISTED_PATHS) {
    if (!STRUCTURE_PAGES.some((p) => p.path === path)) errors.push(`publishing list (visibility.json): ${path} is not in the site structure; run npm run sync:visibility`);
  }
  const unlisted = STRUCTURE_PAGES.filter((p) => !p.path.includes('#') && !DEDICATED.includes(p.path) && !LISTED_PATHS.includes(p.path));
  if (unlisted.length) console.warn(`Not in the publishing list (shown as published): ${unlisted.map((p) => p.path).join(', ')}. Run npm run sync:visibility.`);
  const taken = new Set(STRUCTURE_PAGES.map((p) => p.path));
  const clash = (path: string, what: string) => taken.has(path) && errors.push(`${what}: address ${path} is used by a page`);
  reg.projects.forEach((p) => clash(`/projects/${p.id}/`, `projects/${p.id}`));
  reg.publications.forEach((p) => clash(`/research/${p.id}/`, `publications/${p.id}`));
  reg.dimensions.forEach((d) => clash(`/philosophy/layers/${d.id}/`, `dimensions/${d.id}`));
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

export type Cite = ReturnType<typeof citations>;

/* ------------------------------------------------------------- Queries */

/** Listed projects selected by flag, category or status (all if none given). */
export function projectsWhere(
  reg: Registry,
  { filter, category, status }: { filter?: string; category?: string; status?: string },
): Project[] {
  return listed(reg.projects).filter(
    (p) =>
      (filter !== 'featured' || p.data.featured) &&
      (!category || category.split(',').some((c) => (p.data.categories as string[]).includes(c.trim()))) &&
      (!status || p.data.status === status),
  );
}

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
