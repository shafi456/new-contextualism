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
import contributorsJson from '../content/site/contributors.json';
import adoptersJson from '../content/site/early-adopters.json';
import profilesJson from '../content/site/profiles.json';
import relationsJson from '../content/framework/relations.json';
import { PROVENANCE } from './provenance';
import { PLATFORM, SECTIONS, STRUCTURE_PAGES, UTILITIES, isPublic, pageByPath } from './ia';
import { isLive, statusFields } from './visibility';
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
  /** Whether search engines may index the site. */
  searchEngines: z.boolean().default(false),
  prepublicationNote: z.string().default(''),
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
// Each address must exist in the site structure; those not published are left out.
const inStructure = (path: string, what: string) => {
  if (!STRUCTURE_PAGES.some((p) => p.path === path)) throw new Error(`${what}: no page in the site structure for ${path}`);
};
glossary.forEach((g) => {
  g.see.forEach((path) => inStructure(path, `glossary “${g.term}”`));
  g.see = g.see.filter(isPublic);
});
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

const bodies = governanceSchema.parse(governanceJson).bodies;
bodies.forEach((b) => inStructure(b.path, `governance “${b.name}”`));
/** The bodies whose pages are published. */
export const governance = bodies.filter((b) => isPublic(b.path));

/**
 * The people of the movement, each entered once and shown wherever they
 * belong: in the Pedagogical Nodes, the Practice & Policy Council, the
 * Contributors and the Early Adopters. Only the name is required, so that a
 * person can be listed before the profile is confirmed.
 */
const peopleSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string().trim().min(1),
      designation: z.string().optional(),
      affiliation: z.string().optional(),
      photo: z.string().optional(),
      photoAlt: z.string().optional(),
      photoCredit: z.string().optional(),
      biography: z.string().optional(),
      work: z.array(z.string()).default([]),
      links: z.array(z.object({ label: z.string().min(1), url: z.url() })).default([]),
    }),
  ),
});

/**
 * A group's members: who belongs to it, chosen from the people above, and
 * what is specific to the group (the person's contribution to it, and, for
 * contributors and early adopters, their role). A membership that is a
 * draft, or scheduled for later, is kept in the file but left out of the site.
 */
const groupSchema = z.object({
  entries: z.array(
    z.object({
      person: z.string().trim().min(1),
      ...statusFields,
      contribution: z.string().optional(),
      /** Role within the movement (contributors and early adopters). */
      role: z.string().optional(),
    }),
  ),
});

const studentSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string().min(1),
      photo: z.string().optional(),
      photoCredit: z.string().optional(),
      university: z.string().min(1),
      ...statusFields,
    }),
  ),
});

const people = peopleSchema.parse(profilesJson).entries;
const seen = new Set<string>();
people.forEach((p) => {
  if (seen.has(p.name)) throw new Error(`People: "${p.name}" is entered twice; keep one entry.`);
  seen.add(p.name);
});

/**
 * A group's published members, each with the person's shared profile. A
 * member whose person is missing from the list of people is left out, with a
 * warning in the build log. Every photograph needs a credit: one saved
 * without a credit is not shown (the profile shows initials), rather than
 * stopping the site from updating.
 */
function members(json: unknown, where: string) {
  return groupSchema
    .parse(json)
    .entries.filter(isLive)
    .flatMap((m) => {
      const p = people.find((x) => x.name === m.person);
      if (!p) {
        console.warn(`${where}: "${m.person}" is not in the list of people, so is not shown.`);
        return [];
      }
      const photo = p.photo && p.photoCredit?.trim() ? p.photo : undefined;
      if (p.photo && !photo) console.warn(`${where}: the photograph of ${p.name} has no credit, so it is not shown.`);
      return [{ ...p, photo, status: m.status, publishAt: m.publishAt, contribution: m.contribution, role: m.role }];
    });
}

export const pedagogicalNodes = members(pedagogicalJson, 'Pedagogical Nodes');
export const practiceCouncil = members(councilJson, 'Practice & Policy Council');
export const students = studentSchema.parse(studentsJson).entries.filter(isLive);
export const contributors = members(contributorsJson, 'Contributors');
export const earlyAdopters = members(adoptersJson, 'Early Adopters');
export type Profile = (typeof contributors)[number];

/** The published sections, for the header and menus. */
export const NAV = SECTIONS.map((s) => ({ href: url(s.path), label: s.nav, number: s.number }));

const link = (path: string, label?: string) => {
  const page = pageByPath(path);
  return { href: url(path), label: label ?? page.short ?? page.title };
};

/** Global utilities, in the order of the site structure. */
export const UTILITY_LINKS = UTILITIES.filter((p) => p.path !== '/accessibility/').map((p) => link(p.path));

/** Pages about the website itself, for the footer. */
export const POLICY_LINKS = [...PLATFORM.map((p) => link(p.path)), ...(isPublic('/accessibility/') ? [link('/accessibility/')] : [])];
