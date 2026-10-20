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

export default defineConfig({
  site,
  base,
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
