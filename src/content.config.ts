/**
 * Content models for the New Contextualism platform.
 *
 * Every collection is a folder of Markdown files in src/content/, editable in
 * code or through the editorial interface at /admin/ (Decap CMS, configured in
 * public/admin/config.yml — keep the two in step when a field changes).
 *
 * Integrity rules enforced here and in src/lib/content.ts:
 *  - every claim-bearing entry records its provenance (see PROVENANCE);
 *  - images require alternative text and a credit;
 *  - cross-references (layers, citation keys, events) must resolve, or the
 *    build fails;
 *  - every page in src/content/pages belongs to the site structure defined in
 *    src/lib/ia.ts and covers the sub-items listed there.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PROVENANCE } from './lib/provenance';

const provenance = z.enum(PROVENANCE);
const approval = z.enum(['pending', 'approved']).default('pending');

const md = (folder: string) =>
  glob({ pattern: '**/[^_]*.md', base: `./src/content/${folder}` });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const figure = (image: () => any) =>
  z.object({
    src: image(),
    alt: z.string().min(1, 'Every image needs alternative text.'),
    credit: z.string().min(1, 'Every image needs a credit.'),
    caption: z.string().optional(),
  });

/**
 * The ten contextual layers. The collection keeps its original name,
 * "dimensions", the founder's term in his April 2025 essay.
 */
const dimensions = defineCollection({
  loader: md('dimensions'),
  schema: z.object({
    /** Position in the order used on this platform. */
    number: z.number().int().min(1).max(10),
    name: z.string(),
    shortName: z.string().optional(),
    summary: z.string(),
    /** The founder's own characterisation of the layer. */
    keywords: z.array(z.string()).min(1),
    keywordsSource: z.string(),
    questions: z.array(z.string()).default([]),
    provenance: provenance.default('editorial-summary'),
    approval,
  }),
});

const projects = defineCollection({
  loader: md('projects'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      status: z.enum(['completed', 'ongoing', 'conceptual']),
      kind: z.string(),
      year: z.number().int().optional(),
      /** Year of the earliest published source documenting the project. */
      documented: z.number().int(),
      location: z.string(),
      team: z
        .array(z.object({ name: z.string(), role: z.string().optional() }))
        .default([]),
      summary: z.string(),
      layers: z.array(z.string()).default([]),
      layersBasis: z.enum(['reported', 'editorial']).default('reported'),
      layersNote: z.string().optional(),
      context: z.string().optional(),
      questions: z.array(z.string()).default([]),
      historical: z.string().optional(),
      social: z.string().optional(),
      cultural: z.string().optional(),
      ecological: z.string().optional(),
      process: z.string().optional(),
      response: z.string().optional(),
      outcomes: z.string().optional(),
      sources: z.array(z.string()).min(1, 'A project must cite at least one source.'),
      /**
       * Editorial classification used by the Projects section: design
       * proposals (architectural, urban, heritage and landscape), research and
       * documentation, teaching and studio work, and comparative and
       * experimental studies. A project may belong to several.
       */
      categories: z
        .array(z.enum(['architectural', 'urban', 'heritage-landscape', 'research', 'teaching', 'comparative']))
        .default([]),
      /** Points for the project map, with the precision each can claim. */
      places: z
        .array(
          z.object({
            name: z.string(),
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
            precision: z.enum(['site', 'locality', 'city', 'district', 'region']),
            /** Places with the same area share one marker on the map. */
            area: z.string().optional(),
            note: z.string().optional(),
          }),
        )
        .default([]),
      plate: z
        .enum(['river', 'canal', 'fabric', 'megablock', 'waterfront', 'hilltop', 'village', 'strata', 'studio'])
        .default('fabric'),
      cover: figure(image).optional(),
      gallery: z.array(figure(image)).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(100),
      provenance: provenance.default('editorial-summary'),
      approval,
      draft: z.boolean().default(false),
      archived: z.boolean().default(false),
    }),
});

const publications = defineCollection({
  loader: md('publications'),
  schema: z.object({
    title: z.string(),
    /** "Family, Given" for people; organisations as written. */
    authors: z.array(z.string()).default([]),
    editors: z.array(z.string()).default([]),
    date: z.coerce.date().optional(),
    year: z.number().int().optional(),
    type: z.enum([
      'book',
      'edited-book',
      'chapter',
      'article',
      'essay',
      'conference-paper',
      'lecture',
      'report',
      'interview',
      'event-listing',
      'web-page',
      'thesis',
    ]),
    /**
     * new-contextualism: the movement's own record (shown in the archive)
     * founder: the founder's wider scholarship (shown in the archive)
     * reference: wider literature (reading lists)
     * source: documentary sources cited for facts (profiles, listings)
     */
    collection: z.enum(['new-contextualism', 'founder', 'reference', 'source']),
    venue: z.string().optional(),
    section: z.string().optional(),
    container: z.string().optional(),
    publisher: z.string().optional(),
    place: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.url().optional(),
    accessed: z.coerce.date().optional(),
    alsoPublished: z
      .array(
        z.object({
          venue: z.string(),
          date: z.coerce.date().optional(),
          url: z.url(),
        }),
      )
      .default([]),
    dimensions: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    summary: z.string().optional(),
    event: z.string().optional(),
    citedBy: z.array(z.string()).default([]),
    provenance: provenance.default('published-source'),
    draft: z.boolean().default(false),
    archived: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: md('events'),
  schema: z.object({
    title: z.string(),
    type: z.enum([
      'workshop',
      'symposium',
      'lecture',
      'seminar',
      'conference',
      'call-for-papers',
      'exhibition',
    ]),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    time: z.string().optional(),
    format: z.enum(['in-person', 'online', 'hybrid']).default('in-person'),
    location: z.string().optional(),
    organiser: z.string().optional(),
    programme: z
      .array(
        z.object({
          title: z.string(),
          speaker: z.string().optional(),
          record: z.string().optional(),
        }),
      )
      .default([]),
    participants: z
      .array(z.object({ name: z.string(), role: z.string().optional() }))
      .default([]),
    summary: z.string(),
    sources: z.array(z.string()).min(1, 'An event must cite at least one source.'),
    registration: z.url().optional(),
    deadline: z.coerce.date().optional(),
    provenance: provenance.default('editorial-summary'),
    draft: z.boolean().default(false),
    archived: z.boolean().default(false),
  }),
});

const people = defineCollection({
  loader: md('people'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      honorific: z.string().optional(),
      role: z.string(),
      portrait: figure(image).optional(),
      appointments: z
        .array(
          z.object({
            title: z.string(),
            organisation: z.string(),
            period: z.string().optional(),
            source: z.string(),
          }),
        )
        .default([]),
      education: z
        .array(
          z.object({
            degree: z.string(),
            institution: z.string(),
            year: z.number().int().optional(),
            source: z.string(),
          }),
        )
        .default([]),
      affiliations: z
        .array(z.object({ title: z.string(), source: z.string() }))
        .default([]),
      presentations: z
        .array(
          z.object({
            title: z.string(),
            venue: z.string(),
            date: z.string(),
            source: z.string(),
          }),
        )
        .default([]),
      links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
      provenance: provenance.default('editorial-summary'),
      approval,
    }),
});

/**
 * The pages of the site structure: one Markdown file per page, in a folder
 * per section. Numbers and titles come from src/lib/ia.ts. A body may embed
 * modules (diagrams, lists, maps) with <!-- module: name key="value" -->.
 */
const pages = defineCollection({
  loader: md('pages'),
  schema: z.object({
    /** The page's address, as listed in src/lib/ia.ts. */
    path: z.string().regex(/^\/([a-z0-9-]+\/)*$/, 'A path starts and ends with a slash, e.g. /philosophy/principles/'),
    intro: z.string().optional(),
    updated: z.coerce.date(),
    provenance: provenance.default('editorial-summary'),
    /** "none" for pages that make no claims needing the founder's approval, such as the sitemap. */
    approval: z.enum(['pending', 'approved', 'none']).default('pending'),
  }),
});

export const collections = {
  dimensions,
  projects,
  publications,
  events,
  people,
  pages,
};
