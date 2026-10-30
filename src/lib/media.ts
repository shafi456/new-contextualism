/**
 * Images for projects and layers. When permitted documentation exists it
 * is used; otherwise an abstract editorial plate is shown, always labelled so
 * that it cannot be mistaken for a drawing of the project.
 */
import type { ImageMetadata } from 'astro';
import type { Dimension, Project } from './content';
import { DIMENSION_PLATE_NOTES } from './drawing/dimension-plates.ts';
import { url } from './url';

export const PLATE_DESCRIPTIONS: Record<string, string> = {
  river: 'a meandering river with sandbar islands, paddy fields and small settlements',
  canal: 'a dense urban fabric divided by a narrow canal with green edges',
  fabric: 'a dense, irregular urban fabric with lanes, small open courts and a river edge',
  megablock: 'a large building footprint within a grid of urban blocks, crossed by green corridors',
  waterfront: 'an urban fabric meeting the sea along a promenade, with a pier',
  hilltop: 'a walled enclosure on a hill, with houses stepping down the contours',
  village: 'homesteads clustered around ponds among fields and trees',
  strata: 'a site section with ground strata, buildings, and present and future water levels',
  studio: 'ten stacked planes in exploded axonometric, each with its own pattern',
};

export interface Media {
  src: string | ImageMetadata;
  alt: string;
  width?: number;
  height?: number;
  caption: string;
  credit?: string;
  tag?: string;
  abstract: boolean;
}

export function projectMedia(project: Project): Media {
  const cover = project.data.cover;
  if (cover) {
    return {
      src: cover.src,
      alt: cover.alt,
      caption: cover.caption ?? project.data.title,
      credit: cover.credit,
      abstract: false,
    };
  }
  const desc = PLATE_DESCRIPTIONS[project.data.plate];
  return {
    src: url(`/plates/project-${project.data.plate}.svg`),
    alt: `Abstract editorial plate: ${desc}. It does not depict the project.`,
    width: 1600,
    height: 1200,
    caption: `Abstract plate: ${desc}. An original editorial drawing; it does not depict the project. Documentation will be added with the permission of the project’s authors.`,
    tag: 'Abstract plate',
    abstract: true,
  };
}

export function dimensionMedia(d: Dimension): Media {
  const note = DIMENSION_PLATE_NOTES[d.id] ?? '';
  return {
    src: url(`/plates/dimension-${d.id}.svg`),
    alt: `Analytical diagram for the ${d.data.name.toLowerCase()} layer. ${note}`,
    width: 1200,
    height: 900,
    caption: `${note} Original editorial drawing; an abstract diagram, not a documented site.`,
    tag: 'Editorial diagram',
    abstract: true,
  };
}

export const HERO_PLATE: Media = {
  src: url('/plates/hero.svg'),
  alt: 'An abstract figure–ground drawing: a meandering river with sandbar islands crosses a landscape of paddy fields and contours; on its banks, a dense, irregular old settlement gives way to a planned grid. A red section line cuts across the city.',
  width: 2400,
  height: 1100,
  caption:
    'Settlement, water and terrain. An abstract figure–ground study, drawn for this platform; it does not represent a real site.',
  abstract: true,
};
