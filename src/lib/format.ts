/** Formatting helpers shared by pages, citations and the search index. */

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Dates are stored as UTC midnight; always read them back in UTC. */
export function formatDate(date: Date, precision: 'day' | 'month' | 'year' = 'day'): string {
  const y = date.getUTCFullYear();
  if (precision === 'year') return String(y);
  const m = MONTHS[date.getUTCMonth()];
  if (precision === 'month') return `${m} ${y}`;
  return `${date.getUTCDate()} ${m} ${y}`;
}

/** American-style date for Chicago bibliography entries: "April 23, 2025". */
export function formatDateUS(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Formats a partial ISO date ("2013", "2013-09", "2023-06-10"). */
export function formatPartialDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  if (!m) return String(y);
  if (!d) return `${MONTHS[m - 1]} ${y}`;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export interface PersonName {
  family?: string;
  given?: string;
  literal?: string;
}

/** Names are stored as "Family, Given"; anything without a comma is an organisation. */
export function parseName(value: string): PersonName {
  const i = value.indexOf(',');
  if (i === -1) return { literal: value.trim() };
  return { family: value.slice(0, i).trim(), given: value.slice(i + 1).trim() };
}

export function displayName(value: string): string {
  const n = parseName(value);
  return n.literal ?? `${n.given} ${n.family}`;
}

export function familyName(value: string): string {
  const n = parseName(value);
  return n.literal ?? n.family ?? value;
}

export function initials(given: string): string {
  return given
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(' ');
}

/** "A, B and C" (British style, used in running text). */
export function joinList(items: string[], conjunction = 'and'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’“”'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Two-digit index used throughout the editorial system: 1 → "01". */
export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/\[@[^\]]+\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
