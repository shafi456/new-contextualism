export const PROVENANCE = [
  'published-source', // verified statement from a published source
  'editorial-summary', // summary written by the editors from cited sources
  'proposed', // proposed statement (e.g. mission), not yet approved
  'founder-approved', // text approved by the founder for this platform
  'interpretation', // editorial interpretation or critical commentary
] as const;

export type Provenance = (typeof PROVENANCE)[number];

export const PROVENANCE_META: Record<
  Provenance,
  { label: string; description: string }
> = {
  'published-source': {
    label: 'Published source',
    description:
      'A statement, quotation or record taken from a published and cited source.',
  },
  'editorial-summary': {
    label: 'Editorial summary',
    description:
      'Written by the editors from the cited sources; not itself a statement by the founder.',
  },
  proposed: {
    label: 'Proposed statement',
    description: 'A draft put forward for discussion. It has no official status until approved.',
  },
  'founder-approved': {
    label: 'Approved by the founder',
    description: 'Text approved by the founder for publication on this platform.',
  },
  interpretation: {
    label: 'Interpretation',
    description: 'Editorial interpretation or critical commentary, offered for discussion.',
  },
};

export const STATUS_LABELS = {
  completed: 'Completed project',
  ongoing: 'Ongoing research',
  conceptual: 'Conceptual proposal',
} as const;

export const STATUS_DESCRIPTIONS = {
  completed: 'Built or otherwise realised work, documented after completion.',
  ongoing: 'Research, teaching or development that is still in progress.',
  conceptual: 'Unbuilt proposals: theses, studio projects and competition entries.',
} as const;

/** The editorial classification used in the Projects section. */
export const CATEGORY_LABELS: Record<string, string> = {
  architectural: 'Architectural design',
  urban: 'Urban design',
  'heritage-landscape': 'Heritage and landscape',
  research: 'Research and documentation',
  teaching: 'Teaching and studio',
  comparative: 'Comparative and experimental',
};

/** How precisely a point on the project map locates a project. */
export const PRECISION_LABELS: Record<string, string> = {
  site: 'Site',
  locality: 'Neighbourhood',
  city: 'City',
  district: 'District, approximate',
  region: 'Region, approximate',
};

export const TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  'edited-book': 'Edited book',
  chapter: 'Book chapter',
  article: 'Journal article',
  essay: 'Essay',
  'conference-paper': 'Conference paper',
  lecture: 'Lecture',
  report: 'Report',
  interview: 'Interview',
  'event-listing': 'Event listing',
  'web-page': 'Web page',
  thesis: 'Thesis',
};

export const COLLECTION_LABELS: Record<string, string> = {
  'new-contextualism': 'New Contextualism',
  founder: 'Founder’s earlier scholarship',
  reference: 'Wider reference',
  source: 'Documentary source',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: 'Workshop',
  symposium: 'Symposium',
  lecture: 'Lecture',
  seminar: 'Seminar',
  conference: 'Conference',
  'call-for-papers': 'Call for papers',
  exhibition: 'Exhibition',
};
