/** Each record's citation as an RIS file (/research/{id}.ris), for reference managers. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { registry } from '../../lib/content';
import { ris } from '../../lib/cite';

export const getStaticPaths = (async () => {
  const reg = await registry();
  return reg.publications.map((p) => ({ params: { id: p.id } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const reg = await registry();
  const record = reg.publication.get(params.id ?? '');
  if (!record) return new Response('Not found', { status: 404 });
  return new Response(`${ris(record)}\r\n`, {
    headers: { 'Content-Type': 'application/x-research-info-systems; charset=utf-8' },
  });
};
