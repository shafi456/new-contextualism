/**
 * Markdown rendering with scholarly citations.
 *
 * Editors cite a record by its file name: [@reza-2025-deltaic-bangladesh], or
 * several at once: [@key-one; @key-two]. Citations become author–date links
 * to the page's bibliography. Unknown keys fail the build.
 */
import { Marked } from 'marked';
import { escapeHtml, slugify } from './format';
import { url } from './url';

const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const html = this.parser.parseInline(tokens);
      const id = slugify(html.replace(/<[^>]+>/g, ''));
      return `<h${depth} id="${id}">${html}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      // Internal links written as /path/ are given the site's base path.
      return `<a href="${escapeHtml(url(href))}"${t}${external ? ' class="ext"' : ''}>${text}</a>`;
    },
  },
});

const CITATION = /\[(@[\w.-]+(?:\s*;\s*@[\w.-]+)*)\]/g;

export interface CiteContext {
  /** Returns the author–date label for a key; throws for unknown keys. */
  label: (key: string) => string;
  onCite?: (key: string) => void;
  href?: (key: string) => string;
}

function citations(src: string, ctx: CiteContext): string {
  return src.replace(CITATION, (_match, group: string) => {
    const keys = group.split(';').map((k) => k.trim().replace(/^@/, ''));
    const links = keys.map((key) => {
      const label = ctx.label(key);
      ctx.onCite?.(key);
      const href = ctx.href ? ctx.href(key) : `#ref-${key}`;
      return `<a class="cite" href="${href}">${escapeHtml(label)}</a>`;
    });
    return `<span class="citation">(${links.join('; ')})</span>`;
  });
}

export function renderMarkdown(src: string | undefined, ctx: CiteContext): string {
  if (!src?.trim()) return '';
  return marked.parse(citations(src, ctx), { async: false }) as string;
}

export function renderInline(src: string | undefined, ctx: CiteContext): string {
  if (!src?.trim()) return '';
  return marked.parseInline(citations(src, ctx), { async: false }) as string;
}

/** Keys cited in a Markdown string, in order of first appearance. */
export function citedKeys(src: string | undefined): string[] {
  if (!src) return [];
  const out: string[] = [];
  for (const m of src.matchAll(CITATION)) {
    for (const k of m[1].split(';')) {
      const key = k.trim().replace(/^@/, '');
      if (!out.includes(key)) out.push(key);
    }
  }
  return out;
}
