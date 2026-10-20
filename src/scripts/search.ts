/**
 * Client-side search over /search-index.json. Nothing leaves the browser.
 */
import { url } from '../lib/url';

export interface SearchEntry {
  /** title */ t: string;
  /** url */ u: string;
  /** kind, e.g. "Dimension" */ k: string;
  /** summary */ s: string;
  /** body text */ b: string;
  /** extra keywords */ x: string;
}

export interface SearchHit {
  entry: SearchEntry;
  score: number;
  excerpt: string;
}

let index: Promise<SearchEntry[]> | undefined;

export function loadIndex(): Promise<SearchEntry[]> {
  index ??= fetch(url('/search-index.json'))
    .then((r) => {
      if (!r.ok) throw new Error(`Search index unavailable (${r.status})`);
      return r.json() as Promise<SearchEntry[]>;
    })
    .catch((err) => {
      index = undefined;
      throw err;
    });
  return index;
}

export const normalise = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function terms(query: string): string[] {
  return normalise(query)
    .split(/[\s,;:.!?'"‘’“”()]+/)
    .filter((t) => t.length > 1);
}

export function search(entries: SearchEntry[], query: string, limit = 40): SearchHit[] {
  const qs = terms(query);
  if (!qs.length) return [];
  const hits: SearchHit[] = [];
  for (const entry of entries) {
    const title = normalise(entry.t);
    const extra = normalise(entry.x);
    const summary = normalise(entry.s);
    const body = normalise(entry.b);
    let score = 0;
    let all = true;
    for (const q of qs) {
      let s = 0;
      if (title.includes(q)) s += title.startsWith(q) || title.includes(` ${q}`) ? 12 : 8;
      if (extra.includes(q)) s += 5;
      if (summary.includes(q)) s += 3;
      if (body.includes(q)) s += 1;
      if (!s) {
        all = false;
        break;
      }
      score += s;
    }
    if (all) hits.push({ entry, score, excerpt: excerpt(entry, qs) });
  }
  return hits.sort((a, b) => b.score - a.score || a.entry.t.localeCompare(b.entry.t)).slice(0, limit);
}

function excerpt(entry: SearchEntry, qs: string[]): string {
  const source = entry.s && qs.some((q) => normalise(entry.s).includes(q)) ? entry.s : entry.b || entry.s;
  const n = normalise(source);
  let at = -1;
  for (const q of qs) {
    const i = n.indexOf(q);
    if (i > -1 && (at === -1 || i < at)) at = i;
  }
  if (at < 0 || source.length <= 180) return source.slice(0, 180) + (source.length > 180 ? '…' : '');
  const start = Math.max(0, at - 70);
  const end = Math.min(source.length, at + 130);
  return (start > 0 ? '…' : '') + source.slice(start, end).trim() + (end < source.length ? '…' : '');
}

/** Wraps matched terms in <mark>; input is plain text, output is safe HTML. */
export function highlight(text: string, qs: string[]): string {
  const n = normalise(text);
  // Normalisation rarely changes length (ligatures); if it does, skip marking.
  if (!qs.length || n.length !== text.length) return escapeHtml(text);
  const ranges: [number, number][] = [];
  for (const q of qs) {
    let i = n.indexOf(q);
    while (i > -1) {
      ranges.push([i, i + q.length]);
      i = n.indexOf(q, i + q.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let out = '';
  let last = 0;
  for (const [s, e] of ranges) {
    if (s < last) continue;
    out += escapeHtml(text.slice(last, s)) + '<mark>' + escapeHtml(text.slice(s, e)) + '</mark>';
    last = e;
  }
  return out + escapeHtml(text.slice(last));
}

export function renderHits(list: HTMLElement, hits: SearchHit[], query: string): void {
  const qs = terms(query);
  list.innerHTML = hits
    .map(
      (h) => `<li><a href="${escapeHtml(h.entry.u)}">
        <span class="label search-result__kind">${escapeHtml(h.entry.k)}</span>
        <span class="search-result__title">${highlight(h.entry.t, qs)}</span>
        <span class="search-result__excerpt">${highlight(h.excerpt, qs)}</span>
      </a></li>`,
    )
    .join('');
}

export function statusText(count: number, query: string): string {
  if (!query.trim()) return '';
  if (!count) return `No results for “${query.trim()}”`;
  return `${count} result${count === 1 ? '' : 's'}`;
}
