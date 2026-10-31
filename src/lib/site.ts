/**
 * Site-wide data that is not a collection: settings, chronology, glossary,
 * frequently asked questions, the proposed governance structure and the
 * editorial map of relations between layers. Each file is validated when the
 * site is built, so an invalid edit fails the build instead of shipping.
 */
import { z } from 'astro/zod';
import settingsJson from '../content/site/settings.json';
import chronologyJson from '../content/site/chronology.json';
import glossaryJson from '../content/site/glossary.json';
import faqJson from '../content/site/faq.json';
import governanceJson from '../content/site/governance.json';
import relationsJson from '../content/framework/relations.json';
import { PROVENANCE } from './provenance';
import { SECTIONS, UTILITIES, pageByPath } from './ia';
import { url } from './url';

const statement = z.object({
  text: z.string(),
  provenance: z.enum(['proposed', 'founder-approved']),
});

const settingsSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  taglineApproved: z.boolean(),
  description: z.string(),
  footerLine: z.string(),
  prepublication: z.boolean(),
  prepublicationNote: z.string(),
  contactEmail: z.union([z.literal(''), z.email()]),
  institutionalLinks: z.array(z.object({ label: z.string(), url: z.url() })),
  socialLinks: z.array(z.object({ label: z.string(), url: z.url() })),
  mission: statement,
  vision: statement,
});

const chronologySchema = z.object({
  items: z.array(
    z.object({
      date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
      dateLabel: z.string().optional(),
      title: z.string(),
      text: z.string(),
      sources: z.array(z.string()).min(1),
      href: z.string().optional(),
    }),
  ),
});

const relationsSchema = z.object({
  note: z.string(),
  relations: z.array(
    z.object({
      a: z.string(),
      b: z.string(),
      note: z.string(),
      source: z.string().optional(),
    }),
  ),
});

export const settings = settingsSchema.parse(settingsJson);
export const chronology = chronologySchema
  .parse(chronologyJson)
  .items.slice()
  .sort((x, y) => x.date.localeCompare(y.date));
const relationsData = relationsSchema.parse(relationsJson);
export const relationsNote = relationsData.note;
export const relations = relationsData.relations.map((r) => ({
  ...r,
  id: `${r.a}--${r.b}`,
}));
export type Relation = (typeof relations)[number];

const glossarySchema = z.object({
  terms: z.array(
    z.object({
      term: z.string(),
      /** Markdown; may cite records with [@key]. */
      definition: z.string(),
      provenance: z.enum(PROVENANCE).default('editorial-summary'),
      /** Pages for further reading, as site paths. */
      see: z.array(z.string()).default([]),
    }),
  ),
});

const faqSchema = z.object({
  items: z.array(
    z.object({
      question: z.string(),
      /** Markdown; may cite records with [@key]. */
      answer: z.string(),
    }),
  ),
});

export const glossary = glossarySchema
  .parse(glossaryJson)
  .terms.slice()
  .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
glossary.forEach((g) => g.see.forEach((path) => pageByPath(path)));
export const faq = faqSchema.parse(faqJson).items;

/** The bodies of the proposed governance structure (none yet constituted). */
const governanceSchema = z.object({
  bodies: z
    .array(
      z.object({
        name: z.string(),
        /** Its role, in a few words, e.g. "Theoretical guardianship". */
        role: z.string(),
        text: z.string(),
      }),
    )
    .min(1),
});

export const governance = governanceSchema.parse(governanceJson).bodies;

/** The six sections, for the header and menus. */
export const NAV = SECTIONS.map((s) => ({ href: url(s.path), label: s.nav, number: s.number }));

const link = (path: string, label?: string) => {
  const page = pageByPath(path);
  return { href: url(path), label: label ?? page.short ?? page.title };
};

/** Global utilities, in the order of the site structure. */
export const UTILITY_LINKS = UTILITIES.filter((p) => p.path !== '/accessibility/').map((p) => link(p.path));

/** Governance and policy pages, for the footer. */
export const POLICY_LINKS = [
  link('/governance/', 'About the platform'),
  link('/governance/editorial-standards/'),
  link('/governance/corrections/', 'Corrections'),
  link('/governance/copyright/'),
  link('/governance/privacy-and-terms/'),
  link('/accessibility/'),
  link('/governance/contact/'),
];
