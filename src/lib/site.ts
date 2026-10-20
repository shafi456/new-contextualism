/**
 * Site-wide data that is not a collection: settings, chronology and the
 * editorial map of relations between dimensions. Each file is validated when
 * the site is built, so an invalid edit fails the build instead of shipping.
 */
import { z } from 'astro/zod';
import settingsJson from '../content/site/settings.json';
import chronologyJson from '../content/site/chronology.json';
import relationsJson from '../content/framework/relations.json';
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

export const NAV = [
  { href: url('/movement/'), label: 'The Movement' },
  { href: url('/philosophy/'), label: 'Philosophy' },
  { href: url('/framework/'), label: 'Framework' },
  { href: url('/projects/'), label: 'Projects' },
  { href: url('/research/'), label: 'Research' },
  { href: url('/about/'), label: 'About' },
] as const;

export const FOOTER_LINKS = [
  { href: url('/contact/'), label: 'Contact' },
  { href: url('/research/'), label: 'Publications' },
  { href: url('/privacy/'), label: 'Privacy' },
  { href: url('/accessibility/'), label: 'Accessibility' },
  { href: url('/editorial-standards/'), label: 'Editorial standards' },
] as const;
