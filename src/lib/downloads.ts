/**
 * The files offered for download (/downloads/{file}), generated at build time
 * from the platform's data. Each states what it contains and where it comes
 * from; templates are editorial drafts, not instruments issued by the founder.
 */
import type { Provenance } from './provenance';
import { archiveRecords, listed, registry } from './content';
import { bibtex, ris } from './cite';
import { relations } from './site';
import { processSvg, scalesSvg, tenLayersSvg } from './drawing/diagrams';

export type DownloadGroup = 'diagrams' | 'templates' | 'instruments' | 'guidance' | 'bibliography';

export interface Download {
  file: string;
  title: string;
  format: string;
  group: DownloadGroup;
  description: string;
  provenance: Provenance;
}

export const DOWNLOADS: Download[] = [
  {
    file: 'ten-layers.svg',
    title: 'The ten contextual layers and their relations',
    format: 'SVG',
    group: 'diagrams',
    description: 'The ten layers on a ring, joined by the relations proposed between them.',
    provenance: 'interpretation',
  },
  {
    file: 'scales-of-context.svg',
    title: 'Scales of context',
    format: 'SVG',
    group: 'diagrams',
    description: 'Universal values, regional ideas, the neighbourhood and the site, after Reza (2023).',
    provenance: 'editorial-summary',
  },
  {
    file: 'read-plan-process.svg',
    title: 'Read, Plan, Process',
    format: 'SVG',
    group: 'diagrams',
    description: 'The three phases named by Reza and Nitu (2025), with the ten layers that structure the reading.',
    provenance: 'editorial-summary',
  },
  {
    file: 'layer-relations.csv',
    title: 'Relations between the layers',
    format: 'CSV',
    group: 'diagrams',
    description: 'The relations behind the diagrams, as a table: each pair of layers, its description and any example.',
    provenance: 'interpretation',
  },
  {
    file: 'ten-layer-reading-sheet.csv',
    title: 'Ten-layer reading sheet',
    format: 'CSV',
    group: 'templates',
    description:
      'One row per layer, with the founder’s terms, questions proposed by the editors and empty columns for observations, sources and weight.',
    provenance: 'proposed',
  },
  {
    file: 'new-contextualism-archive.bib',
    title: 'The archive, in BibTeX',
    format: 'BibTeX',
    group: 'bibliography',
    description: 'Every record of New Contextualism and of the founder’s scholarship.',
    provenance: 'published-source',
  },
  {
    file: 'new-contextualism-archive.ris',
    title: 'The archive, in RIS',
    format: 'RIS',
    group: 'bibliography',
    description: 'The same records, for Zotero, EndNote or Mendeley.',
    provenance: 'published-source',
  },
  {
    file: 'all-records.bib',
    title: 'Every record on the platform, in BibTeX',
    format: 'BibTeX',
    group: 'bibliography',
    description: 'The archive with the wider references and the documentary sources cited for facts.',
    provenance: 'published-source',
  },
  {
    file: 'all-records.ris',
    title: 'Every record on the platform, in RIS',
    format: 'RIS',
    group: 'bibliography',
    description: 'The same records, for reference managers.',
    provenance: 'published-source',
  },
];

export const downloadsIn = (group: DownloadGroup) => DOWNLOADS.filter((d) => d.group === group);

/* --------------------------------------------------------------- Files */

const csv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n') + '\r\n';

/** Media types of the download formats, by file extension. */
export const DOWNLOAD_TYPES: Record<string, string> = {
  svg: 'image/svg+xml; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  bib: 'application/x-bibtex; charset=utf-8',
  ris: 'application/x-research-info-systems; charset=utf-8',
};

/** The contents of a download, generated from the platform's data. */
export async function downloadBody(file: string): Promise<string | undefined> {
  const reg = await registry();
  const layers = reg.dimensions.map((d) => ({ id: d.id, number: d.data.number, name: d.data.name }));
  const name = (id: string) => reg.dimension.get(id)?.data.name ?? id;
  switch (file) {
    case 'ten-layers.svg':
      return tenLayersSvg(layers, relations);
    case 'scales-of-context.svg':
      return scalesSvg();
    case 'read-plan-process.svg':
      return processSvg(layers);
    case 'layer-relations.csv':
      return csv([
        ['Layer', 'Related layer', 'Relation (editorial interpretation)', 'Example drawn from', 'Record'],
        ...relations.map((r) => [
          name(r.a),
          name(r.b),
          r.note,
          r.source ? (reg.labels.get(r.source) ?? '') : '',
          r.source ? `/research/${r.source}/` : '',
        ]),
      ]);
    case 'ten-layer-reading-sheet.csv':
      return csv([
        ['No.', 'Layer', 'In the founder’s terms', 'Questions (proposed by the editors)', 'Observations', 'Sources', 'Weight in this project'],
        ...reg.dimensions.map((d) => [d.data.number, d.data.name, d.data.keywords.join(', '), d.data.questions.join(' | '), '', '', '']),
        [],
        [
          '',
          'Terms from Reza (2025), The Daily Star. Questions proposed by the editors of the New Contextualism platform (pre-publication edition); an editorial draft, not an instrument issued by the founder.',
        ],
      ]);
    case 'new-contextualism-archive.bib':
      return archiveRecords(reg).map(bibtex).join('\n\n') + '\n';
    case 'new-contextualism-archive.ris':
      return archiveRecords(reg).map(ris).join('\r\n') + '\r\n';
    case 'all-records.bib':
      return listed(reg.publications).map(bibtex).join('\n\n') + '\n';
    case 'all-records.ris':
      return listed(reg.publications).map(ris).join('\r\n') + '\r\n';
  }
  return undefined;
}
