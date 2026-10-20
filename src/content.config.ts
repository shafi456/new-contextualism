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
 *  - cross-references (dimensions, citation keys, events) must resolve, or the
 *    build fails.
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

const dimensions = defineCollection({
  loader: md('dimensions'),
  schema: z.object({
    number: z.number().int().min(1).max(10),
    name: z.string(),
    shortName: z.string().optional(),
    summary: z.string(),
    /** The founder's own characterisation of the dimension. */
    keywords: z.array(z.string()).min(1),
    keywordsSource: z.string(),
    questions: z.array(z.string()).default([]),
    provenance: provenance.default('editorial-summary'),
    approval,
  }),
});

const philosophy = defineCollection({
  loader: md('philosophy'),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    navTitle: z.string().optional(),
    provenance,
    approval,
    figure: z
      .enum(['none', 'dimensions', 'scales', 'relations', 'process', 'chronology', 'bibliography'])
      .default('none'),
    /** A pull quotation, verified word for word against its source. */
    quote: z
      .object({
        text: z.string(),
        author: z.string(),
        source: z.string(),
      })
      .optional(),
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

const pages = defineCollection({
  loader: md('pages'),
  schema: z.object({
    title: z.string(),
    label: z.string(),
    intro: z.string().optional(),
    updated: z.coerce.date(),
    provenance: provenance.default('editorial-summary'),
    approval,
  }),
});

export const collections = {
  dimensions,
  philosophy,
  projects,
  publications,
  events,
  people,
  pages,
};
