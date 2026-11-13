/**
 * Publication status: what is public, what is a draft and what is scheduled.
 *
 * Editors set a status for every section and page in
 * src/content/site/visibility.json ("Publishing" in the editorial interface),
 * and for each profile in its own list. The status is applied when the site is
 * built: a draft is not built at all, so it has no address, is absent from the
 * navigation, the sitemap, the search index and the feeds, and links to it are
 * removed. Nothing is deleted; the content stays in the repository.
 *
 * A scheduled item becomes public at the first build after its date (the site
 * is rebuilt every hour, see .github/workflows/deploy.yml).
 *
 * Building with NC_PREVIEW=1 shows everything, for checking drafts locally.
 */
import { z } from 'astro/zod';
import data from '../content/site/visibility.json';

export const STATUSES = ['published', 'draft', 'scheduled'] as const;
export type Status = (typeof STATUSES)[number];

const PREVIEW = process.env.NC_PREVIEW === '1';
const NOW = Date.now();

/** Status fields shared by sections, pages and profiles. */
export const statusFields = {
  status: z.enum(STATUSES).default('published'),
  /** When a scheduled item becomes public, as an ISO date and time. */
  publishAt: z.string().nullish(),
};

/** Whether an item with this status is public now. */
export function isLive(item: { status?: Status; publishAt?: string | null }): boolean {
  if (PREVIEW || !item.status || item.status === 'published') return true;
  if (item.status !== 'scheduled' || !item.publishAt) return false;
  const at = Date.parse(item.publishAt);
  return !Number.isNaN(at) && at <= NOW;
}

const entry = z.object({ title: z.string(), path: z.string().optional(), ...statusFields });
const schema = z.object({ sections: z.array(entry.extend({ pages: z.array(entry.extend({ path: z.string() })).default([]) })) });

const sections = schema.parse(data).sections;

/** Every address listed in the publishing file, to check against the site structure. */
export const LISTED_PATHS = sections.flatMap((s) => [...(s.path ? [s.path] : []), ...s.pages.map((p) => p.path)]);

/**
 * Addresses that are not public. Each also hides everything beneath it: a
 * hidden section hides its pages and records, and a hidden page hides the
 * records under its address.
 */
export const HIDDEN: string[] = sections.flatMap((s) =>
  isLive(s) ? s.pages.filter((p) => !isLive(p)).map((p) => p.path) : [...(s.path ? [s.path] : []), ...s.pages.map((p) => p.path)],
);

/** Whether a site path (without the base path) is public. */
export const isPublic = (path: string) => !HIDDEN.some((h) => path === h || path.startsWith(h));
