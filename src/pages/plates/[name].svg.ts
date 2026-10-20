/**
 * The platform's original drawings, generated at build time as static SVG
 * files: /plates/hero.svg, /plates/project-{variant}.svg and
 * /plates/dimension-{id}.svg.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { heroPlate } from '../../lib/drawing/plates.ts';
import { projectPlate, type ProjectVariant } from '../../lib/drawing/project-plates.ts';
import { dimensionPlate } from '../../lib/drawing/dimension-plates.ts';

const VARIANTS: ProjectVariant[] = [
  'river',
  'canal',
  'fabric',
  'megablock',
  'waterfront',
  'hilltop',
  'village',
  'strata',
  'studio',
];

export const getStaticPaths = (async () => {
  const dimensions = await getCollection('dimensions');
  return [
    { params: { name: 'hero' } },
    ...VARIANTS.map((v) => ({ params: { name: `project-${v}` } })),
    ...dimensions.map((d) => ({ params: { name: `dimension-${d.id}` } })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const name = params.name ?? '';
  let svg: string;
  if (name === 'hero') svg = heroPlate();
  else if (name.startsWith('project-')) svg = projectPlate(name.slice('project-'.length) as ProjectVariant);
  else svg = dimensionPlate(name.slice('dimension-'.length));
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
