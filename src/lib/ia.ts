/**
 * The information architecture of the platform: one source of truth for the
 * navigation, section sidebars, breadcrumbs, pagers, the sitemap and the
 * build-time checks. Titles follow the agreed page structure exactly, and
 * `number` is an internal key that is never displayed; `items` are the sub-items each page covers (rendered as its
 * second-level headings).
 */
import { slugify } from './format';
import { url } from './url';
import { isPublic } from './visibility';

export interface IaPage {
  number: string;
  title: string;
  /** Shorter title for tight spaces (sidebars, pagers). */
  short?: string;
  /** Path below the site root, with leading and trailing slashes. */
  path: string;
  /** One-line description, used on overview pages and in the sitemap. */
  summary: string;
  items?: string[];
  /** 'wide' pages put the section navigation above the content. */
  layout?: 'text' | 'wide';
  /** Shows only the title, subtitle and description, with no provenance or date. */
  introOnly?: boolean;
}

export interface IaSection {
  number: string;
  key: 'home' | 'philosophy' | 'methodologies' | 'projects' | 'research' | 'community' | 'governance' | 'utilities' | 'platform';
  title: string;
  /** Label in the header navigation. */
  nav: string;
  path: string;
  summary: string;
  pages: IaPage[];
}

export const LAYER_ORDER = [
  'social',
  'cultural',
  'historical',
  'political',
  'economic',
  'ecological',
  'geographical',
  'scientific',
  'urban',
  'architectural',
] as const;

export const HOME: IaSection = {
  number: '0',
  key: 'home',
  title: 'Home',
  nav: 'Home',
  path: '/',
  summary: 'The platform’s front page.',
  pages: [
    { number: '0.1', title: 'Start Here: How to Use New Contextualism', short: 'Start here', path: '/#start-here', summary: 'Five ways into the platform.' },
    { number: '0.2', title: 'Introduction and Core Proposition', short: 'Introduction', path: '/#introduction', summary: 'What New Contextualism proposes.' },
    { number: '0.3', title: 'Key Ideas', path: '/#key-ideas', summary: 'The approach in six ideas.' },
    { number: '0.4', title: 'The Ten Contextual Layers: Overview', short: 'The ten layers', path: '/#layers', summary: 'The ten layers and their relations.' },
    { number: '0.5', title: 'Explore the Philosophy', path: '/#philosophy', summary: 'The sections of the philosophy.' },
    { number: '0.6', title: 'Explore the Methodologies and Frameworks', short: 'Explore the methodologies', path: '/#methodologies', summary: 'How the approach is applied.' },
    { number: '0.7', title: 'Featured Projects and Case Studies', short: 'Featured projects', path: '/#projects', summary: 'Selected applications.' },
    { number: '0.8', title: 'Latest Research and Publications', short: 'Latest research', path: '/#research', summary: 'Recent records in the archive.' },
    { number: '0.9', title: 'Join the Community', path: '/#community', summary: 'Ways to take part.' },
  ],
};

/** The whole structure, whatever its publication status. */
export const ALL_SECTIONS: IaSection[] = [
  {
    number: '1',
    key: 'philosophy',
    title: 'Philosophy',
    nav: 'Philosophy',
    path: '/philosophy/',
    summary: 'What New Contextualism is, where it came from, and how it understands context.',
    pages: [
      { number: '1.1', title: 'Overview', path: '/philosophy/', summary: 'The philosophy at a glance, and how this section is organised.' },
      {
        number: '1.2',
        title: 'Definition and Scope',
        path: '/philosophy/definition-and-scope/',
        summary: 'What the approach is, why it was proposed, and what it covers.',
        items: ['What Is New Contextualism?', 'Why New Contextualism?', 'Scope and Intellectual Contribution'],
      },
      {
        number: '1.3',
        title: 'Origins and Evolution',
        path: '/philosophy/origins-and-evolution/',
        summary: 'From practice in Barisal and research on Bengal to a developing theory.',
        items: ['Intellectual Origins', 'Development of the Theory', 'Key Milestones'],
      },
      {
        number: '1.4',
        title: 'Foundational Propositions and Key Principles',
        short: 'Propositions and Principles',
        path: '/philosophy/principles/',
        summary: 'The principles of the approach, as they have been formulated.',
      },
      {
        number: '1.5',
        title: 'Relational Ontology of the Built Environment',
        short: 'Relational Ontology',
        path: '/philosophy/relational-ontology/',
        summary: 'Context as a living, layered and evolving fabric of relations.',
        items: [
          'Understanding Context as Relational',
          'Interdependence of Contextual Conditions',
          'Relationships Between People, Place and Time',
        ],
      },
      {
        number: '1.6',
        title: 'The Ten Contextual Layers: Definitions',
        short: 'The Ten Contextual Layers',
        path: '/philosophy/layers/',
        summary: 'Each of the ten layers, defined in the founder’s terms.',
        items: ['Social', 'Cultural', 'Historical', 'Political', 'Economic', 'Ecological', 'Geographical', 'Scientific', 'Urban', 'Architectural'],
      },
      {
        number: '1.7',
        title: 'Global South and Postcolonial Positioning',
        short: 'Global South Positioning',
        path: '/philosophy/global-south/',
        summary: 'Knowledge, power and local epistemologies in the approach.',
        items: ['Knowledge and Power', 'Local Epistemologies', 'Contextuality Across Different Societies'],
      },
      {
        number: '1.8',
        title: 'Framework Family and Related Concepts',
        short: 'Framework Family',
        path: '/philosophy/framework-family/',
        summary: 'New Contextualism and the frameworks developed from it.',
        items: [
          'New Contextualism (NC)',
          'New Contextual Urbanism (NCU)',
          'New Contextual Heritage Management (NCHM)',
          'New Contextual Design Methodology (NCDM)',
          'Contextual Intelligence (CI)',
          'Related Research Theories',
        ],
      },
      {
        number: '1.9',
        title: 'Relationship to Other Theories',
        short: 'Other Theories',
        path: '/philosophy/related-theories/',
        summary: 'Contextualism, critical regionalism, place theory, heritage and sustainability.',
        items: [
          'Architectural Contextualism',
          'Critical Regionalism',
          'Place Theory and Placemaking',
          'Heritage and Conservation Theory',
          'Sustainability, Ecology and Urban Justice',
        ],
      },
      {
        number: '1.10',
        title: 'Critical Perspectives and Open Questions',
        short: 'Critical Perspectives',
        path: '/philosophy/critical-perspectives/',
        summary: 'Questions the approach has yet to settle.',
      },
    ],
  },
  {
    number: '2',
    key: 'methodologies',
    title: 'Methodologies and Frameworks',
    nav: 'Methodologies and Frameworks',
    path: '/methodologies/',
    summary: 'How the approach is applied: the framework, the process and the tools.',
    pages: [
      { number: '2.1', title: 'Overview', path: '/methodologies/', summary: 'How this section is organised.' },
      {
        number: '2.2',
        title: 'Foundational Framework',
        path: '/methodologies/foundational-framework/',
        summary: 'Applying the ten layers, their relations and the scales of context.',
        items: ['Applying the Ten Contextual Layers', 'Relationships Between the Layers', 'Scales of Context', 'Contextual Analysis and Interpretation'],
        layout: 'wide',
      },
      {
        number: '2.3',
        title: 'Read–Plan–Process',
        path: '/methodologies/read-plan-process/',
        summary: 'The three phases with which every project is said to begin.',
        items: ['READ: Investigating Context', 'PLAN: Translating Findings into Strategy', 'PROCESS: Developing, Testing and Refining'],
      },
      {
        number: '2.4',
        title: 'Architectural Design',
        path: '/methodologies/architectural-design/',
        summary: 'Reading architectural context and making context-informed decisions.',
        items: [
          'New Contextual Design Methodology (NCDM)',
          'Reading Architectural Context',
          'Context-Informed Design Decisions',
          'Design Evaluation',
        ],
      },
      {
        number: '2.5',
        title: 'Urbanism and Urban Design',
        path: '/methodologies/urbanism/',
        summary: 'Morphology, urban systems and equitable transformation.',
        items: [
          'New Contextual Urbanism (NCU)',
          'Urban Morphology and Spatial Relationships',
          'Urban Systems and Interdependencies',
          'Equitable Urban Transformation',
        ],
      },
      {
        number: '2.6',
        title: 'Heritage Management',
        path: '/methodologies/heritage-management/',
        summary: 'Continuity, values and the assessment of heritage in context.',
        items: [
          'New Contextual Heritage Management (NCHM)',
          'Cultural Continuity and Change',
          'Tangible and Intangible Heritage',
          'Heritage Values and Stakeholders',
          'Contextual Heritage Assessment',
        ],
      },
      {
        number: '2.7',
        title: 'Contextual Intelligence',
        path: '/methodologies/contextual-intelligence/',
        summary: 'Contextual knowledge and decision-making.',
        items: ['Concept and Scope', 'Contextual Knowledge and Decision-Making', 'Applications and Assessment'],
      },
      {
        number: '2.8',
        title: 'Analytical Tools and Methods',
        path: '/methodologies/analytical-tools/',
        summary: 'Mapping, social and historical analysis, diagrams and participation.',
        items: [
          'Context Mapping and Documentation',
          'Stakeholder and Social Analysis',
          'Historical and Spatial Analysis',
          'Systems and Relationship Diagrams',
          'Participatory Assessment',
        ],
      },
      {
        number: '2.9',
        title: 'Evaluation and Trade-offs',
        path: '/methodologies/evaluation/',
        summary: 'Weighing layers, equity, scenarios and learning.',
        items: ['Competing Contextual Priorities', 'Ethical and Equity Considerations', 'Scenario Testing', 'Monitoring and Learning'],
      },
      {
        number: '2.10',
        title: 'Tools and Resources',
        path: '/methodologies/tools-and-resources/',
        summary: 'Diagrams, templates, instruments and guidance.',
        items: ['Framework Diagrams', 'Analytical Templates', 'Assessment Instruments', 'Guidance Documents'],
      },
    ],
  },
  {
    number: '3',
    key: 'projects',
    title: 'Projects',
    nav: 'Projects',
    path: '/projects/',
    summary: 'Proposals, research and teaching in which the approach has been applied.',
    pages: [
      { number: '3.1', title: 'Overview', path: '/projects/', summary: 'How projects are documented and classified.', layout: 'wide' },
      { number: '3.2', title: 'Featured Projects', path: '/projects/featured/', summary: 'Selected projects.', layout: 'wide' },
      { number: '3.3', title: 'Built and Realised Projects', short: 'Built and Realised', path: '/projects/built/', summary: 'Built or otherwise realised work.', layout: 'wide' },
      {
        number: '3.4',
        title: 'Design Proposals',
        path: '/projects/design-proposals/',
        summary: 'Unbuilt architectural, urban, heritage and landscape proposals.',
        items: ['Architectural Design', 'Urban Design', 'Heritage and Landscape Proposals'],
        layout: 'wide',
      },
      { number: '3.5', title: 'Research and Documentation Projects', short: 'Research and Documentation', path: '/projects/research-and-documentation/', summary: 'Research programmes and documentation.', layout: 'wide' },
      { number: '3.6', title: 'Teaching and Studio Projects', short: 'Teaching and Studio', path: '/projects/teaching-and-studio/', summary: 'Studios, theses and teaching.', layout: 'wide' },
      { number: '3.7', title: 'Comparative and Experimental Studies', short: 'Comparative and Experimental', path: '/projects/comparative-and-experimental/', summary: 'Comparative and experimental work.', layout: 'wide' },
      {
        number: '3.8',
        title: 'All Projects',
        path: '/projects/all/',
        summary: 'Every project, as a list or on a map, with search and filters.',
        items: ['List and Map Views', 'Search and Filter', 'Project Type', 'Geographic Location', 'Contextual Layers', 'Project Status'],
        layout: 'wide',
      },
    ],
  },
  {
    number: '4',
    key: 'research',
    title: 'Research and Publications',
    nav: 'Research and Publications',
    path: '/research/',
    summary: 'The published record of New Contextualism and the research behind it.',
    pages: [
      { number: '4.1', title: 'Overview', path: '/research/', summary: 'How the archive is organised.' },
      {
        number: '4.2',
        title: 'Publications',
        path: '/research/publications/',
        summary: 'Books, articles, conference papers and reports.',
        items: ['Books and Edited Volumes', 'Journal Articles', 'Conference Papers', 'Research Reports'],
      },
      { number: '4.3', title: 'Lectures and Presentations', path: '/research/lectures/', summary: 'Lectures, talks and presentations.' },
      {
        number: '4.4',
        title: 'Civilizational and Historical Research',
        short: 'Civilizational Research',
        path: '/research/civilizational-history/',
        summary: 'Research on the cultural and civilizational history of Bengal.',
        items: ['Syncretic Cultural History Theory (SCHT)', 'Ganga-Brahmaputra Civilization (GBC)', 'Related Historical Research'],
      },
      {
        number: '4.5',
        title: 'Bibliographic Archive',
        path: '/research/archive/',
        summary: 'Every record, with filters.',
        items: ['Foundational Writings', 'Related Scholarship', 'Critical and Comparative Literature'],
        layout: 'wide',
      },
      { number: '4.6', title: 'Further Reading', path: '/research/further-reading/', summary: 'An editorial selection of related literature.' },
      {
        number: '4.7',
        title: 'Citation Tools',
        path: '/research/citation/',
        summary: 'How to cite, permanent links, BibTeX and RIS.',
        items: ['How to Cite New Contextualism', 'DOI and Permanent Links', 'BibTeX', 'RIS'],
      },
    ],
  },
  {
    number: '5',
    key: 'community',
    title: 'Movement and Community',
    nav: 'Movement and Community',
    path: '/community/',
    summary: 'The people, events and exchanges through which the approach develops.',
    pages: [
      { number: '5.1', title: 'Overview', path: '/community/', summary: 'The movement and how to take part.' },
      { number: '5.2', title: 'Timeline and Milestones', path: '/community/timeline/', summary: 'A dated record of the approach’s development.' },
      {
        number: '5.3',
        title: 'Events',
        path: '/community/events/',
        summary: 'Conferences, workshops, seminars and public lectures.',
        items: ['Conferences', 'Workshops', 'Seminars', 'Public Lectures'],
      },
      { number: '5.4', title: 'Contributors', path: '/community/contributors/', summary: 'People who have contributed to the public record.' },
      { number: '5.5', title: 'Collaborations and Partnerships', short: 'Collaborations', path: '/community/collaborations/', summary: 'Formal collaborations and partnerships.' },
      {
        number: '5.6',
        title: 'Early Adopters and Applications',
        short: 'Early Adopters',
        path: '/community/adopters/',
        summary: 'Where the approach is taught and used.',
        items: ['Institutions and Programmes', 'Practitioners and Studios', 'Courses Using New Contextualism', 'Documented Use Cases'],
      },
      { number: '5.7', title: 'Calls for Papers and Contributions', short: 'Calls for Papers', path: '/community/calls/', summary: 'Open calls.' },
      { number: '5.8', title: 'Community Submissions', path: '/community/submissions/', summary: 'How to submit work to the platform.' },
      {
        number: '5.9',
        title: 'Community Discussions and Critical Responses',
        short: 'Discussions and Responses',
        path: '/community/discussions/',
        summary: 'Debate about the approach, including its critics.',
      },
      { number: '5.10', title: 'Student Engagement and Opportunities', short: 'Students', path: '/community/students/', summary: 'Studios, workshops and opportunities for students.' },
    ],
  },
  {
    number: '6',
    key: 'governance',
    title: 'Governance',
    nav: 'Governance',
    path: '/governance/',
    summary: 'The five-part governance ecosystem of New Contextualism as an intellectual movement.',
    pages: [
      { number: '6.1', title: 'Overview', path: '/governance/', summary: 'The five bodies of the governance ecosystem, and their members.', layout: 'wide' },
      { number: '6.2', title: 'Curatorial Core', path: '/governance/curatorial-core/', summary: 'Theoretical guardianship, and the founder of the movement.' },
      { number: '6.3', title: 'Pedagogical Nodes', path: '/governance/pedagogical-nodes/', summary: 'Academic integration through education and research.' },
      { number: '6.4', title: 'Practice & Policy Council', path: '/governance/practice-and-policy-council/', summary: 'Real-world application in practice and policy.' },
      { number: '6.5', title: 'Open Assembly', path: '/governance/open-assembly/', summary: 'Global discourse.', introOnly: true },
      { number: '6.6', title: 'NC Student Nexus', path: '/governance/nc-student-nexus/', summary: 'A student-led sandbox, and its directory.' },
    ],
  },
];

/**
 * The published structure: sections and pages that are drafts, or scheduled
 * for later, are left out, and with them their navigation, listings and
 * addresses (see src/lib/visibility.ts).
 */
export const SECTIONS: IaSection[] = ALL_SECTIONS.filter((s) => isPublic(s.path)).map((s) => ({
  ...s,
  pages: s.pages.filter((p) => isPublic(p.path)),
}));

const ALL_UTILITIES: IaPage[] = [
  { number: '', title: 'Search', path: '/search/', summary: 'Search the platform.' },
  { number: '', title: 'Sitemap', path: '/sitemap/', summary: 'Every page on the platform.' },
  { number: '', title: 'Glossary', path: '/glossary/', summary: 'Terms used on the platform.' },
  {
    number: '',
    title: 'Downloads and Resources',
    short: 'Downloads',
    path: '/resources/',
    summary: 'Diagrams, templates, instruments and guidance to download.',
    items: ['Framework Diagrams', 'Analytical Templates', 'Assessment Instruments', 'Guidance Documents'],
  },
  { number: '', title: 'Project Map', path: '/map/', summary: 'Where the documented projects are.', layout: 'wide' },
  { number: '', title: 'Newsletter Subscription', short: 'Newsletter', path: '/newsletter/', summary: 'Following new records and events.' },
  { number: '', title: 'Useful Links', path: '/links/', summary: 'Profiles, publishers and related resources.' },
  { number: '', title: 'Frequently Asked Questions', short: 'FAQ', path: '/faq/', summary: 'Short answers to common questions.' },
  { number: '', title: 'Support the Initiative', short: 'Support', path: '/support/', summary: 'Ways to support the platform.' },
  { number: '', title: 'Accessibility', path: '/accessibility/', summary: 'The platform’s accessibility statement.' },
];

/**
 * Administrative and legal pages about the website itself, kept apart from the
 * governance of the movement. Their earlier addresses under /governance/
 * redirect here (see astro.config.mjs).
 */
const ALL_PLATFORM: IaPage[] = [
  { number: '', title: 'About the Platform', short: 'About the platform', path: '/about/', summary: 'What this platform is for.' },
  { number: '', title: 'Editorial Team', path: '/about/editorial-team/', summary: 'The people who edit the platform.' },
  { number: '', title: 'Advisory Network', path: '/about/advisory-network/', summary: 'Advisers to the platform.' },
  { number: '', title: 'Editorial Standards', path: '/about/editorial-standards/', summary: 'Provenance labels, citations and approval.' },
  { number: '', title: 'Contributions and Review Process', short: 'Review Process', path: '/about/review-process/', summary: 'How submissions are reviewed.' },
  { number: '', title: 'Intellectual Property and Copyright', short: 'Copyright', path: '/about/copyright/', summary: 'Rights in the texts, records and drawings.' },
  { number: '', title: 'Corrections and Updates', short: 'Corrections', path: '/about/corrections/', summary: 'How errors are corrected and changes recorded.' },
  { number: '', title: 'Privacy and Terms of Use', short: 'Privacy and Terms', path: '/about/privacy-and-terms/', summary: 'Privacy, terms of use and accessibility.' },
  { number: '', title: 'Contact', path: '/about/contact/', summary: 'Correspondence with the editors.' },
];

export const UTILITIES = ALL_UTILITIES.filter((p) => isPublic(p.path));
export const PLATFORM = ALL_PLATFORM.filter((p) => isPublic(p.path));

export const PLATFORM_SECTION: IaSection = {
  number: '',
  key: 'platform',
  title: 'Platform',
  nav: 'Platform',
  path: '/about/',
  summary: 'How this website is run, checked and corrected.',
  pages: PLATFORM,
};

/** The global utilities, presented as a section of their own in navigation. */
export const UTILITY_SECTION: IaSection = {
  number: '',
  key: 'utilities',
  title: 'Utilities',
  nav: 'Utilities',
  path: '/sitemap/',
  summary: 'Search, sitemap, glossary, downloads, the project map and other tools.',
  pages: UTILITIES,
};

/* ------------------------------------------------------------- Queries */

/** A published section; undefined while the section is not published. */
export const sectionByKey = (key: IaSection['key']) => SECTIONS.find((s) => s.key === key);

/** Finds the section and page for a site path (without base). */
export function locate(path: string): { section?: IaSection; page?: IaPage; index: number } {
  for (const s of SECTIONS) {
    const index = s.pages.findIndex((p) => p.path === path);
    if (index > -1) return { section: s, page: s.pages[index], index };
  }
  const p = PLATFORM.findIndex((x) => x.path === path);
  if (p > -1) return { section: PLATFORM_SECTION, page: PLATFORM[p], index: p };
  const u = UTILITIES.findIndex((p) => p.path === path);
  return u > -1 ? { page: UTILITIES[u], index: u } : { index: -1 };
}

export function pageByPath(path: string): IaPage {
  const found = locate(path).page;
  if (!found) throw new Error(`No page in the site structure for ${path}`);
  return found;
}

export const href = (p: { path: string }) => url(p.path);

/** Pages served by their own route files rather than by src/content/pages. */
export const DEDICATED = ['/search/'];

/** A section's first page, which stands for the section as a whole. */
export const isOverview = (section: IaSection | undefined, page: IaPage) => section?.pages[0] === page;

/** Every section page, in reading order . */
export const SEQUENCE: { section: IaSection; page: IaPage }[] = SECTIONS.flatMap((section) =>
  section.pages.map((page) => ({ section, page })),
);

/** The previous and next pages in reading order. */
export function neighbours(path: string) {
  const i = SEQUENCE.findIndex((x) => x.page.path === path);
  if (i < 0) return { prev: undefined, next: undefined };
  return { prev: SEQUENCE[i - 1], next: SEQUENCE[i + 1] };
}

/** The anchor of a sub-item, as generated for the page's second-level headings. */
export const itemId = (item: string) => slugify(item);

/** Every page in the structure, sections first, then utilities. */
export const ALL_PAGES: IaPage[] = [...SECTIONS.flatMap((s) => s.pages), ...UTILITIES, ...PLATFORM];

/** Every page of the whole structure, published or not, for the build-time checks. */
export const STRUCTURE_PAGES: IaPage[] = [...ALL_SECTIONS.flatMap((s) => s.pages), ...ALL_UTILITIES, ...ALL_PLATFORM];

export { isPublic };
