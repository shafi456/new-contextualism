/**
 * Citations: author–date labels (Chicago style), full bibliography entries,
 * and APA and BibTeX exports for record pages.
 */
import type { CollectionEntry } from 'astro:content';
import {
  escapeHtml,
  familyName,
  formatDateUS,
  initials,
  MONTHS,
  parseName,
} from './format';

export type Publication = CollectionEntry<'publications'>;

export function pubYear(p: Publication): number | undefined {
  return p.data.year ?? p.data.date?.getUTCFullYear();
}

function creators(p: Publication): { names: string[]; editors: boolean } {
  if (p.data.authors.length) return { names: p.data.authors, editors: false };
  return { names: p.data.editors, editors: true };
}

function shortAuthors(p: Publication): string {
  const { names } = creators(p);
  const fam = names.map(familyName);
  if (fam.length === 0) return p.data.title.split(/\s+/).slice(0, 3).join(' ');
  if (fam.length === 1) return fam[0];
  if (fam.length === 2) return `${fam[0]} and ${fam[1]}`;
  return `${fam[0]} et al.`;
}

/**
 * Builds the author–date label for every record ("Reza 2023b"), adding a
 * letter when one author has several records in the same year.
 */
export function buildLabels(pubs: Publication[]): Map<string, string> {
  const groups = new Map<string, Publication[]>();
  for (const p of pubs) {
    const base = `${shortAuthors(p)} ${pubYear(p) ?? 'n.d.'}`;
    groups.set(base, [...(groups.get(base) ?? []), p]);
  }
  const labels = new Map<string, string>();
  for (const [base, items] of groups) {
    if (items.length === 1) {
      labels.set(items[0].id, base);
      continue;
    }
    items
      .slice()
      .sort((a, b) => {
        const da = a.data.date?.getTime() ?? 0;
        const db = b.data.date?.getTime() ?? 0;
        return da - db || a.data.title.localeCompare(b.data.title);
      })
      .forEach((p, i) => labels.set(p.id, `${base}${String.fromCharCode(97 + i)}`));
  }
  return labels;
}

/** Year part of a label, including any disambiguating letter. */
export function labelYear(label: string): string {
  const m = label.match(/(\d{4}[a-z]?|n\.d\.[a-z]?)$/);
  return m ? m[1] : '';
}

/* ---------------------------------------------------------------- Chicago */

function chicagoNames(names: string[]): string {
  const formatted = names.map((value, i) => {
    const n = parseName(value);
    if (n.literal) return n.literal;
    return i === 0 ? `${n.family}, ${n.given}` : `${n.given} ${n.family}`;
  });
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}

function plainNames(names: string[]): string {
  const formatted = names.map((value) => {
    const n = parseName(value);
    return n.literal ?? `${n.given} ${n.family}`;
  });
  if (formatted.length <= 1) return formatted.join('');
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}

const ital = (s: string) => `<i>${escapeHtml(s)}</i>`;
/** A quoted title; quotation marks inside it become single quotes. */
const quoted = (s: string) => {
  const inner = s.replace(/“/g, '‘').replace(/”/g, '’');
  return `“${escapeHtml(inner)}${/[?!]$/.test(inner) ? '' : '.'}”`;
};
const ensureStop = (s: string) => (/[.?!”]$/.test(s) ? s : `${s}.`);

function link(url: string): string {
  return `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`;
}

/** Full bibliography entry in Chicago author–date style, as HTML. */
export function chicago(p: Publication, label: string): string {
  const d = p.data;
  const { names, editors } = creators(p);
  const year = labelYear(label);
  const head = names.length
    ? `${escapeHtml(chicagoNames(names))}${editors ? (names.length > 1 ? ', eds' : ', ed') : ''}`
    : '';
  const parts: string[] = [];
  parts.push(head ? `${ensureStop(head)} ${year}.` : `${year}.`);

  const pubPlace =
    d.place && d.publisher ? `${escapeHtml(d.place)}: ${escapeHtml(d.publisher)}.` : d.publisher ? `${escapeHtml(d.publisher)}.` : '';
  const doiOrUrl = d.doi ? link(`https://doi.org/${d.doi}`) + '.' : d.url ? link(d.url) + '.' : '';

  switch (d.type) {
    case 'book':
    case 'edited-book':
      parts.push(`${ital(d.title)}.`, pubPlace, doiOrUrl);
      break;
    case 'chapter': {
      let s = `${quoted(d.title)} In ${ital(d.container ?? '')}`;
      if (d.editors.length) s += `, edited by ${escapeHtml(plainNames(d.editors))}`;
      if (d.pages) s += `, ${escapeHtml(d.pages)}`;
      parts.push(`${s}.`, pubPlace, doiOrUrl);
      break;
    }
    case 'article':
    case 'conference-paper': {
      let s = `${quoted(d.title)} ${ital(d.venue ?? d.container ?? '')}`;
      if (d.volume) s += ` ${escapeHtml(d.volume)}`;
      if (d.issue) s += ` (${escapeHtml(d.issue)})`;
      if (d.pages) s += `: ${escapeHtml(d.pages)}`;
      parts.push(`${s}.`, doiOrUrl);
      break;
    }
    case 'essay':
    case 'interview': {
      let s = `${quoted(d.title)} ${ital(d.venue ?? '')}`;
      if (d.date) s += `, ${formatDateUS(d.date)}`;
      parts.push(`${s}.`, doiOrUrl);
      break;
    }
    case 'lecture': {
      let s = `${quoted(d.title)} Lecture presented at the ${escapeHtml(d.venue ?? '')}`;
      if (d.place) s += `, ${escapeHtml(d.place)}`;
      if (d.date) s += `, ${formatDateUS(d.date)}`;
      parts.push(`${s}.`, doiOrUrl);
      break;
    }
    case 'report':
      if (d.publisher) {
        parts.push(`${ital(d.title)}.`, pubPlace, doiOrUrl);
      } else {
        let s = `${quoted(d.title)} ${escapeHtml(d.venue ?? '')}`;
        if (d.date) s += `, ${formatDateUS(d.date)}`;
        parts.push(`${s}.`, doiOrUrl);
      }
      break;
    default: {
      let s = `${quoted(d.title)} ${escapeHtml(d.venue ?? '')}.`;
      if (d.accessed) s += ` Accessed ${formatDateUS(d.accessed)}.`;
      parts.push(s, doiOrUrl);
    }
  }
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').replace(/\.\./g, '.');
}

/* -------------------------------------------------------------------- APA */

function apaNames(names: string[]): string {
  const formatted = names.map((value) => {
    const n = parseName(value);
    return n.literal ?? `${n.family}, ${initials(n.given ?? '')}`;
  });
  if (formatted.length === 1) return formatted[0];
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
}

/** APA 7th edition reference, as plain text with *asterisks* for italics. */
export function apa(p: Publication): string {
  const d = p.data;
  const { names, editors } = creators(p);
  const date = d.date
    ? `${d.date.getUTCFullYear()}, ${MONTHS[d.date.getUTCMonth()]} ${d.date.getUTCDate()}`
    : String(pubYear(p) ?? 'n.d.');
  const who = names.length ? `${apaNames(names)}${editors ? ` (Ed${names.length > 1 ? 's' : ''}.)` : ''}` : '';
  const where = d.doi ? `https://doi.org/${d.doi}` : (d.url ?? '');
  const tail = [where].filter(Boolean).join(' ');
  let body: string;
  switch (d.type) {
    case 'book':
    case 'edited-book':
      body = `*${d.title}*. ${d.publisher ?? ''}.`;
      break;
    case 'chapter':
      body = `${d.title}. In ${d.editors.length ? `${apaNames(d.editors)} (Ed${d.editors.length > 1 ? 's' : ''}.), ` : ''}*${d.container ?? ''}*${d.pages ? ` (pp. ${d.pages})` : ''}. ${d.publisher ?? ''}.`;
      break;
    case 'article':
    case 'conference-paper':
      body = `${d.title}. *${d.venue ?? ''}*${d.volume ? `, *${d.volume}*` : ''}${d.issue ? `(${d.issue})` : ''}${d.pages ? `, ${d.pages}` : ''}.`;
      break;
    case 'lecture':
      body = `*${d.title}* [Lecture]. ${d.venue ?? ''}${d.place ? `, ${d.place}` : ''}.`;
      break;
    default:
      body = `${d.title}. *${d.venue ?? d.publisher ?? ''}*.`;
  }
  return `${who ? `${who} ` : ''}(${date}). ${body} ${tail}`.replace(/\s+/g, ' ').replace(/\.\./g, '.').trim();
}

/* -------------------------------------------------------------------- RIS */

const RIS_TYPE: Record<string, string> = {
  book: 'BOOK',
  'edited-book': 'EDBOOK',
  chapter: 'CHAP',
  article: 'JOUR',
  essay: 'NEWS',
  interview: 'NEWS',
  'conference-paper': 'CPAPER',
  lecture: 'SLIDE',
  report: 'RPRT',
  'event-listing': 'ELEC',
  'web-page': 'ELEC',
  thesis: 'THES',
};

const risDate = (d: Date) =>
  `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/`;

/** RIS record, the exchange format read by Zotero, EndNote and Mendeley. */
export function ris(p: Publication): string {
  const d = p.data;
  const lines: [string, string | undefined][] = [['TY', RIS_TYPE[d.type] ?? 'GEN']];
  const names = (list: string[], tag: string) =>
    list.forEach((v) => {
      const n = parseName(v);
      lines.push([tag, n.literal ?? `${n.family}, ${n.given}`]);
    });
  names(d.authors, 'AU');
  names(d.editors, 'ED');
  lines.push(['TI', d.title]);
  const container = d.type === 'chapter' ? d.container : (d.venue ?? d.container);
  lines.push([d.type === 'article' ? 'JO' : 'T2', container]);
  if (d.section) lines.push(['SE', d.section]);
  lines.push(['PY', String(pubYear(p) ?? '')]);
  if (d.date) lines.push(['DA', risDate(d.date)]);
  lines.push(['PB', d.publisher], ['CY', d.place], ['VL', d.volume], ['IS', d.issue]);
  if (d.pages) {
    const [sp, ep] = d.pages.split(/[–-]/);
    lines.push(['SP', sp], ['EP', ep]);
  }
  lines.push(['DO', d.doi], ['UR', d.url]);
  if (d.accessed) lines.push(['Y2', risDate(d.accessed)]);
  d.topics.forEach((t) => lines.push(['KW', t]));
  lines.push(['ID', p.id], ['ER', '']);
  // Every tag takes the form "TY  - value"; empty fields are left out, except
  // the closing "ER  - ".
  return lines
    .filter(([k, v]) => k === 'ER' || (v ?? '').trim() !== '')
    .map(([k, v]) => `${k}  - ${v ?? ''}`)
    .join('\r\n');
}

/* ----------------------------------------------------------------- BibTeX */

const BIBTEX_TYPE: Record<string, string> = {
  book: 'book',
  'edited-book': 'book',
  chapter: 'incollection',
  article: 'article',
  'conference-paper': 'inproceedings',
  essay: 'article',
  report: 'techreport',
  thesis: 'phdthesis',
};

export function bibtex(p: Publication): string {
  const d = p.data;
  const type = BIBTEX_TYPE[d.type] ?? 'misc';
  const bibNames = (list: string[]) =>
    list
      .map((v) => {
        const n = parseName(v);
        return n.literal ? `{${n.literal}}` : `${n.family}, ${n.given}`;
      })
      .join(' and ');
  const fields: [string, string | undefined][] = [
    ['author', d.authors.length ? bibNames(d.authors) : undefined],
    ['editor', d.editors.length ? bibNames(d.editors) : undefined],
    ['title', `{${d.title}}`],
    ['journal', type === 'article' ? d.venue : undefined],
    ['booktitle', type === 'incollection' || type === 'inproceedings' ? (d.container ?? d.venue) : undefined],
    ['series', type === 'inproceedings' && d.container ? d.venue : undefined],
    ['institution', type === 'techreport' ? (d.publisher ?? d.authors[0]) : undefined],
    ['howpublished', type === 'misc' ? d.venue : undefined],
    ['volume', d.volume],
    ['number', d.issue],
    ['pages', d.pages?.replace('–', '--')],
    ['publisher', type === 'techreport' ? undefined : d.publisher],
    ['address', d.place],
    ['year', String(pubYear(p) ?? '')],
    ['month', d.date ? MONTHS[d.date.getUTCMonth()].slice(0, 3).toLowerCase() : undefined],
    ['doi', d.doi],
    ['url', d.url],
  ];
  const body = fields
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(',\n');
  return `@${type}{${p.id},\n${body}\n}`;
}
