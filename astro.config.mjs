// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * The public URL of the site, e.g. https://newcontextualism.org
 * Set SITE_URL when building for production. Canonical URLs, social metadata
 * and the XML sitemap are only generated when it is known, so the build never
 * publishes an address that has not been confirmed.
 */
const site = process.env.SITE_URL || undefined;

/**
 * The path the site is served from. '/' for a domain of its own; a sub-path
 * when hosted in a folder, e.g. BASE_PATH=/new-contextualism for
 * https://shafi456.github.io/new-contextualism/. Internal links use url()
 * from src/lib/url.ts, which adds it.
 */
const base = process.env.BASE_PATH || '/';

/**
 * Addresses from the first edition of the site, redirected to the pages that
 * now hold their content, so that links already shared keep working. Astro
 * does not add the base path to redirect destinations, so it is added here.
 */
const LAYERS = ['social', 'cultural', 'historical', 'political', 'economic', 'ecological', 'geographical', 'urban', 'architectural'];
const PLATFORM_PAGES = ['editorial-team', 'advisory-network', 'editorial-standards', 'review-process', 'copyright', 'corrections', 'privacy-and-terms', 'contact'];
/** @param {string} path */
const to = (path) => `${base.replace(/\/+$/, '')}${path}`;
const redirects = Object.fromEntries(
  Object.entries({
    '/movement': '/community/',
    '/framework': '/methodologies/foundational-framework/',
    '/dialogue': '/community/events/',
    '/contact': '/about/contact/',
    '/governance/founder': '/governance/curatorial-core/#profile',
    // Pages about the website, formerly under Governance.
    ...Object.fromEntries(PLATFORM_PAGES.map((id) => [`/governance/${id}`, `/about/${id}/`])),
    '/privacy': '/about/privacy-and-terms/',
    '/editorial-standards': '/about/editorial-standards/',
    '/framework/scientific-technological': '/philosophy/layers/scientific/',
    ...Object.fromEntries(LAYERS.map((id) => [`/framework/${id}`, `/philosophy/layers/${id}/`])),
  }).map(([from, dest]) => [from, to(dest)]),
);

export default defineConfig({
  site,
  base,
  redirects,
  // Explicit, so behaviour is unchanged if the project is upgraded to Astro 7,
  // where the default changes to 'jsx'.
  compressHTML: true,
  build: { format: 'directory' },
  integrations: site
    ? [sitemap({ filter: (page) => !page.includes('/admin/') })]
    : [],
  image: {
    // Uploaded images are optimised at build time; remote images are not fetched.
    domains: [],
  },
  devToolbar: { enabled: false },
});
