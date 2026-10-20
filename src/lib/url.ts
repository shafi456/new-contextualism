/**
 * Site-relative URLs.
 *
 * The site can be served from the root of a domain or from a sub-path, such as
 * https://shafi456.github.io/new-contextualism/ (set with the BASE_PATH
 * environment variable at build time). Every internal link goes through url()
 * so that it carries the base path.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function url(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `${BASE}${path}`;
}
