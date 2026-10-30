/**
 * Downloadable files, generated at build time: framework diagrams (SVG),
 * tables and templates (CSV), and the bibliography (BibTeX, RIS).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { DOWNLOADS, DOWNLOAD_TYPES, downloadBody } from '../../lib/downloads';

export const getStaticPaths = (() => DOWNLOADS.map((d) => ({ params: { file: d.file } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const file = params.file ?? '';
  const body = await downloadBody(file);
  if (body === undefined) return new Response('Not found', { status: 404 });
  const type = DOWNLOAD_TYPES[file.split('.').pop() ?? ''] ?? 'text/plain; charset=utf-8';
  return new Response(body, { headers: { 'Content-Type': type } });
};
