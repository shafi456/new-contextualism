/**
 * Addresses of the platform's records and pages. Components link through
 * these helpers rather than writing paths, so that the site structure in
 * src/lib/ia.ts can change in one place.
 */
import { url } from './url';

const query = (params?: Record<string, string | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => v && q.set(k, v));
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const to = {
  home: () => url('/'),
  layers: () => url('/philosophy/layers/'),
  layer: (id: string) => url(`/philosophy/layers/${id}/`),
  framework: () => url('/methodologies/foundational-framework/'),
  project: (id: string) => url(`/projects/${id}/`),
  projects: (params?: Record<string, string | undefined>) => url(`/projects/all/${query(params)}`),
  record: (id: string) => url(`/research/${id}/`),
  archive: (params?: Record<string, string | undefined>) => url(`/research/archive/${query(params)}`),
  event: (id: string) => url(`/community/events/#${id}`),
  contributors: () => url('/community/contributors/'),
  founder: () => url('/governance/curatorial-core/#profile'),
  standards: (hash = '') => url(`/about/editorial-standards/${hash}`),
  contact: (hash = '') => url(`/about/contact/${hash}`),
  search: () => url('/search/'),
};
