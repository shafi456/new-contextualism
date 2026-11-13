// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { HIDDEN, isPublic } from './src/lib/visibility.ts';

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
/** The site path of a destination: without its fragment. @param {string} dest */
const pathOf = (dest) => dest.replace(/[?#].*$/, '');
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
  })
    // A redirect to a page that is not published would lead nowhere.
    .filter(([, dest]) => isPublic(pathOf(dest)))
    .map(([from, dest]) => [from, to(dest)]),
);

/**
 * Removes links to sections and pages that are not published (see
 * src/lib/visibility.ts). The navigation and listings already leave them out;
 * this catches links written by hand in the text, which become plain text, so
 * that no link on the public site leads to a missing page.
 */
const unlinkHidden = {
  name: 'nc-unlink-hidden',
  hooks: {
    /** @param {{ dir: URL }} options */
    'astro:build:done': async ({ dir }) => {
      if (!HIDDEN.length) return;
      const root = fileURLToPath(dir);
      const prefix = base.replace(/\/+$/, '');
      const files = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html'));
      let count = 0;
      for (const f of files) {
        const file = `${root}/${f}`;
        const html = await readFile(file, 'utf8');
        const out = html.replace(/<a\b([^>]*?)\shref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (all, before, href, after, inner) => {
          if (!href.startsWith('/') || href.startsWith('//')) return all;
          const path = pathOf(prefix && href.startsWith(prefix) ? href.slice(prefix.length) : href);
          if (isPublic(path.endsWith('/') ? path : `${path}/`)) return all;
          count++;
          return `<span${before}${after}>${inner}</span>`.replace(/\s(rel|target)="[^"]*"/g, '');
        });
        if (out !== html) await writeFile(file, out);
      }
      console.log(`Publication status: ${HIDDEN.length} address(es) not published; ${count} link(s) to them removed.`);
    },
  },
};

export default defineConfig({
  site,
  base,
  redirects,
  // Explicit, so behaviour is unchanged if the project is upgraded to Astro 7,
  // where the default changes to 'jsx'.
  compressHTML: true,
  build: { format: 'directory' },
  integrations: [...(site ? [sitemap({ filter: (page) => !page.includes('/admin/') })] : []), unlinkHidden],
  image: {
    // Uploaded images are optimised at build time; remote images are not fetched.
    domains: [],
  },
  devToolbar: { enabled: false },
});
