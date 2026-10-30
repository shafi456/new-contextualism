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
      const id = slugify(decodeEntities(html.replace(/<[^>]+>/g, '')));
      return `<h${depth} id="${id}">${html}</h${depth}>\n`;
    },
    /**
     * Callouts: a blockquote that opens with [!PENDING] marks material that
     * has not yet been documented; [!NOTE] marks an editorial note. Text after
     * the marker on the same line becomes the callout's label.
     */
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      const m = body.match(/^<p>\[!(PENDING|NOTE)\][ \t]*([^\n<]*)\n?/);
      if (!m) return `<blockquote>\n${body}</blockquote>\n`;
      const kind = m[1].toLowerCase();
      const title = m[2].trim() || (kind === 'pending' ? 'Awaiting documentation' : 'Editorial note');
      const rest = `<p>${body.slice(m[0].length)}`.replace(/^<p><\/p>\n?/, '');
      const cls = kind === 'pending' ? 'callout pending' : 'callout callout--note';
      return `<div class="${cls}"><span class="label">${title}</span>${rest}</div>\n`;
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

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decodeEntities = (s: string) => s.replace(/&(?:amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e]);

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
