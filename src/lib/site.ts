/**
 * Site-wide data that is not a collection: settings, chronology, glossary,
 * frequently asked questions, the governance structure and its profiles, and the
 * editorial map of relations between layers. Each file is validated when the
 * site is built, so an invalid edit fails the build instead of shipping.
 */
import { z } from 'astro/zod';
import settingsJson from '../content/site/settings.json';
import chronologyJson from '../content/site/chronology.json';
import glossaryJson from '../content/site/glossary.json';
import faqJson from '../content/site/faq.json';
import governanceJson from '../content/site/governance.json';
import pedagogicalJson from '../content/site/pedagogical-nodes.json';
import councilJson from '../content/site/practice-policy-council.json';
import studentsJson from '../content/site/student-nexus.json';
import relationsJson from '../content/framework/relations.json';
import { PROVENANCE } from './provenance';
import { PLATFORM, SECTIONS, UTILITIES, pageByPath } from './ia';
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

/** The five bodies of the governance of the movement. */
const governanceSchema = z.object({
  bodies: z
    .array(
      z.object({
        name: z.string(),
        /** Its role, in a few words, e.g. "Theoretical guardianship". */
        role: z.string(),
        /** The body's own page, as a site path. */
        path: z.string(),
        /** A one-sentence subtitle, used on the body's page and above its members. */
        summary: z.string().optional(),
        text: z.string(),
      }),
    )
    .min(1),
});

export const governance = governanceSchema.parse(governanceJson).bodies;
governance.forEach((b) => pageByPath(b.path));

/**
 * A member of the Pedagogical Nodes or the Practice & Policy Council. Only the
 * name is required, so that a member can be listed before the profile is
 * confirmed. A photograph needs a credit.
 */
const profileSchema = z.object({
  entries: z.array(
    z
      .object({
        name: z.string().min(1),
        designation: z.string().optional(),
        affiliation: z.string().optional(),
        photo: z.string().optional(),
        photoAlt: z.string().optional(),
        photoCredit: z.string().optional(),
        biography: z.string().optional(),
        contribution: z.string().optional(),
        work: z.array(z.string()).default([]),
        links: z.array(z.object({ label: z.string().min(1), url: z.url() })).default([]),
      })
      .refine((p) => !p.photo || !!p.photoCredit, { message: 'Every photograph needs a credit.' }),
  ),
});

const studentSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string().min(1),
      photo: z.string().optional(),
      photoCredit: z.string().optional(),
      university: z.string().min(1),
    }),
  ),
});

export const pedagogicalNodes = profileSchema.parse(pedagogicalJson).entries;
export const practiceCouncil = profileSchema.parse(councilJson).entries;
export const students = studentSchema.parse(studentsJson).entries;

/** The six sections, for the header and menus. */
export const NAV = SECTIONS.map((s) => ({ href: url(s.path), label: s.nav, number: s.number }));

const link = (path: string, label?: string) => {
  const page = pageByPath(path);
  return { href: url(path), label: label ?? page.short ?? page.title };
};

/** Global utilities, in the order of the site structure. */
export const UTILITY_LINKS = UTILITIES.filter((p) => p.path !== '/accessibility/').map((p) => link(p.path));

/** Pages about the website itself, for the footer. */
export const POLICY_LINKS = [...PLATFORM.map((p) => link(p.path)), link('/accessibility/')];
