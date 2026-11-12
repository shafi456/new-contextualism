# New Contextualism — website

The digital platform, archive and research presence of **New Contextualism**, the architectural and urban design philosophy originated by Mohammad Habib Reza.

The site is built from [`WEBSITE DESIGN PROMPT — NEW CONTEXTUALISM.md`](./WEBSITE%20DESIGN%20PROMPT%20—%20NEW%20CONTEXTUALISM.md) and organised according to the agreed page structure: a home page, six sections and a set of global utilities. It is a static site made with [Astro](https://astro.build), with content stored as Markdown and JSON files and an editorial interface ([Decap CMS](https://decapcms.org)) for editors who do not work with code.

> **Status: pre-publication edition**, published at <https://shafi456.github.io/new-contextualism/>. Every page carries a pre-publication notice and is excluded from search engines until the founder has approved the philosophy text, his profile and the branding. See [Before launch](#before-launch).

---

## Running the site

Requires Node.js 22.12 or later.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
```

## Site structure

The structure is defined once, in [`src/lib/ia.ts`](src/lib/ia.ts): the titles, addresses and sub-items of every page. Page numbers are internal keys and are not displayed anywhere on the site. The header, menus, footer, breadcrumbs, the contents beside each page, the previous and next links, the sitemap and the search index are all generated from it.

| | Section | Address | Pages |
| --- | --- | --- | --- |
| 0 | Home | `/` | 0.1 Start Here … 0.9 Join the Community |
| 1 | Philosophy | `/philosophy/` | 1.1–1.10, and a page for each of the ten layers at `/philosophy/layers/{layer}/` |
| 2 | Methodologies and Frameworks | `/methodologies/` | 2.1–2.10 |
| 3 | Projects | `/projects/` | 3.1–3.8, and a page for each project at `/projects/{project}/` |
| 4 | Research and Publications | `/research/` | 4.1–4.7, and a page for each record at `/research/{record}/` |
| 5 | Movement and Community | `/community/` | 5.1–5.10 |
| 6 | Governance | `/governance/` | Overview, Curatorial Core (with the founder's profile), Pedagogical Nodes, Practice & Policy Council, Open Assembly, NC Student Nexus |
| | Platform | `/about/…` | Pages about the website itself, linked from the footer: About the Platform, Editorial Team, Advisory Network, Editorial Standards, Review Process, Copyright, Corrections, Privacy and Terms, Contact. Their earlier addresses under `/governance/` redirect |
| | Utilities | | Search, Sitemap, Glossary, Downloads and Resources, Project Map, Newsletter, Useful Links, FAQ, Support, Accessibility |

**The build checks the structure.** Every page listed in `ia.ts` must have its Markdown file, every file must belong to the structure, and every sub-item of a page must appear in it as a second-level heading (`## Sub-item`), spelt as in the structure. Otherwise the build fails with a list of what is missing.

Addresses from the first edition of the site (`/movement/`, `/framework/…`, `/dialogue/`, `/contact/`, `/privacy/`, `/editorial-standards/`) redirect to the pages that now hold their content, as does `/governance/founder/`.

## Content integrity

The brief requires that nothing be invented. The site enforces this in four ways.

1. **Provenance labels.** Every substantial text records where it comes from: *published source*, *editorial summary*, *proposed statement*, *approved by the founder*, or *interpretation*. Labels are shown on the page and explained at `/about/editorial-standards/`.
2. **Citations.** Texts cite records by file name, for example `[@reza-2025-deltaic-bangladesh]`. These become author–date links (Chicago style) to the list of sources at the foot of the page. **An unknown citation key fails the build.**
3. **Reference checks.** Layers, sources, events and records referenced anywhere must exist, or the build fails with a list of broken references (`src/lib/content.ts`).
4. **Honest gaps.** Where the structure names something the published record does not yet contain (for example the definitions of New Contextual Urbanism, New Contextual Design Methodology or Contextual Intelligence, an editorial team or an advisory network), the page says so in a marked note rather than filling the gap.

### What the content is based on

All factual content comes from published sources, consulted on 19 October 2026 and on 30–31 October 2026, and listed in the archive with links. Every quotation was checked word for word against the source page.

- **Writing on New Contextualism.** Essays in *The Business Standard* (Reza 2023), *The Daily Star* (Reza 2025) and *Context BD* (Reza and Nitu 2025), and the article on Somapura Mahavihara in *Esempi di Architettura* (Reza and Rahman 2026), the only published use found of the name New Contextual Heritage Management.
- **Events.** Reports and listings of the 2023 and 2024 workshops and the 2025 symposium (BRAC University, Arch-Bangla, Context BD), and the programme of the State Heritage Conference 2025 in Western Australia.
- **The founder.** His BRAC University and ArCHIAM profiles, the UIA 2023 speaker page, and the author notes of his essays, including his 2026 essays on the history of Bengal.
- **Student work.** Thesis, studio and competition projects published by Arch-Bangla, Context BD and BRACU Express that state they follow or draw on the approach.

Where sources disagree (dates, the Al-Cazaba's location, the spiritual/political layer), the site says so rather than choosing silently. The terms *Syncretic Cultural History Theory* and *Ganga-Brahmaputra Civilization*, and the related framework names in the structure, were not found in any published source; the pages concerned explain this and quote the nearest published wording.

### What is editorial, and needs review

- **Layer definitions and research questions.** Editorial summaries built on the founder's own terms for each layer.
- **The 26 relations between layers.** An editorial interpretation; 20 are illustrated with examples from the published record. Stored in `src/content/framework/relations.json`.
- **Descriptions of the Plan and Process phases**, drawn from the published case studies, and the classification of projects into types.
- **Proposed statements:** mission and vision, how contributions are reviewed, copyright, privacy and terms, and the accessibility statement.
- **The ten-layer reading sheet**, an editorial template offered for download.

### Images and maps

No photographs were available with permission, so projects and layers are illustrated with **original abstract drawings**. These are generated at build time (`src/lib/drawing/`) and served from `/plates/*.svg`. Each is tagged "Abstract plate" or "Editorial diagram" and captioned as not depicting the project or a real site. When a project's authors supply images, add them in the editor (*Projects → Cover image*); alternative text and a credit are required, and the image replaces the plate automatically.

The **project map** is drawn from [Natural Earth](https://www.naturalearthdata.com/) data (public domain) and shows no borders. Places are given only as precisely as the sources allow, and approximate places have dashed markers. The base map is generated once by `node scripts/build-map.mjs <folder>` from the Natural Earth files listed in that script; only the result, `src/lib/drawing/map-data.json`, is kept in the repository.

---

## Editing content

### With the editorial interface

```bash
npm run dev    # terminal 1
npm run cms    # terminal 2 – local content server (decap-server)
```

Open <http://localhost:4321/admin/index.html>. Changes are written directly to the files in `src/content/`.

### In the files

| What | Where |
| --- | --- |
| The pages of each section | `src/content/pages/{section}/*.md` (one file per page; the `path` field ties it to the structure) |
| Site settings: tagline, pre-publication flag, contact email, links, mission and vision | `src/content/site/settings.json` |
| Chronology, glossary, frequently asked questions | `src/content/site/chronology.json`, `glossary.json`, `faq.json` |
| Relations between layers | `src/content/framework/relations.json` |
| The ten layers | `src/content/dimensions/*.md` (the files keep the founder's earlier term, *dimensions*) |
| Projects, with their classification and places on the map | `src/content/projects/*.md` |
| Archive records, references and sources | `src/content/publications/*.md` |
| Events | `src/content/events/*.md` |
| Founder profile, shown on Curatorial Core | `src/content/people/*.md` |
| Governance bodies | `src/content/site/governance.json` |
| Profiles: Pedagogical Nodes, Practice & Policy Council, NC Student Nexus | `src/content/site/pedagogical-nodes.json`, `practice-policy-council.json`, `student-nexus.json`. Photographs must be JPG, PNG, WebP or AVIF files in `src/assets/uploads` |

Schemas are in `src/content.config.ts` and `src/lib/site.ts`, and the editor's fields are in `public/admin/config.yml`. Keep them in step.

### Writing a page

Pages are Markdown. Their title comes from the structure, so a page file holds only its introduction, its text and its provenance.

- **Sub-items** are second-level headings, spelt exactly as in `src/lib/ia.ts`.
- **Citations:** `[@record-file-name]`, or several at once: `[@one; @two]`.
- **Notes:** a blockquote that begins `> [!NOTE] Title` is an editorial note; `> [!PENDING] Title` marks material that has not yet been documented.
- **Modules** insert diagrams and lists generated from the data, each on a line of its own, e.g. `<!-- module: chronology -->` or `<!-- module: projects category="urban" -->`. The modules are listed in [`src/lib/modules.ts`](src/lib/modules.ts): section indexes, the layer grid, table and index, the contextual diagram and network, the relations matrix, scales, Read–Plan–Process, principles and aims, the proposed governance structure, project cards, the project browser and map, record lists, the archive, reading lists, lectures, events, contributors, the founder's profile, citation tools, downloads, glossary, FAQ, sitemap, feed, contact and provenance labels. An unknown module or attribute fails the build.

**Useful fields**

- `draft: true`: the entry is hidden in production builds.
- `archived: true`: the entry keeps its address but leaves listings.
- `approval: approved`: once the founder has approved a text, set this and change the provenance to `founder-approved` where appropriate. Pages that make no claims needing approval, such as the sitemap, use `approval: none`.

**Persistent addresses:** `/research/{file-name}/`, `/projects/{file-name}/`, `/philosophy/layers/{layer}/`. Do not rename these files once published.

## Search, feed and downloads

- **Search** runs in the browser against `/search-index.json`, generated at build time from every page and record. Nothing is sent to a server.
- **Feed:** `/feed.xml` (Atom) lists new records and events. It is the platform's way to be followed until a newsletter exists; nothing is collected about its readers.
- **Downloads** (`/downloads/…`) are generated from the data at build time: the framework diagrams (SVG), the relations table and the reading sheet (CSV), and the archive in BibTeX and RIS. Each record page also offers its citation as RIS (`/research/{record}.ris`).

## Design system

- **Colour.** The palette is from the brief, defined as tokens in `src/styles/global.css`. The brief's soft grey `#88877F` is only 3.1:1 against the paper colour, so it is used only for rules, drawings and large text. Small text uses `--ink-2: #65645D` (5.2:1), which meets WCAG AA. Brick red is limited to focus rings, selection states and section lines.
- **Type.** Instrument Serif for headings and Inter for text, both self-hosted through Fontsource, so no requests go to third parties.
- **Grid.** 12 columns, with fluid gutters and type scale. Section pages place the section's contents in a sticky column beside the text (above it on full-width pages, and in a disclosure on small screens).
- **Accessibility.** Includes a skip link, visible focus and semantic landmarks, and diagrams and the map have text equivalents. The contextual diagram is an ARIA tablist operated with the arrow keys, Home and End. Motion respects `prefers-reduced-motion`, and the site works without JavaScript. Every page passes an automated axe audit (WCAG 2.2 AA) at desktop and phone widths.

## Deployment

The site is published with **GitHub Pages** at <https://shafi456.github.io/new-contextualism/>. Every push to `main` rebuilds and redeploys it through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml); you can follow progress in the repository's **Actions** tab.

The workflow reads the address and base path from the Pages settings, so a custom domain needs no code change.

### Custom domain

1. In the repository, open *Settings → Pages → Custom domain*, enter the domain (for example `www.example.org`) and save. GitHub stores it with the Pages settings.
2. At the domain's DNS provider:
   - for the domain itself (`example.org`): four `A` records pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153` (and, optionally, `AAAA` records to `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and `2606:50c0:8003::153`);
   - for a subdomain (`www.example.org`): a `CNAME` record pointing to `shafi456.github.io`.
3. When GitHub has checked the DNS, tick *Enforce HTTPS*.
4. Re-run the deployment (*Actions → Deploy to GitHub Pages → Run workflow*). The site is then built for the root of the new domain; the canonical addresses, the sitemap and the feed follow automatically.
5. If the editorial interface is used in production, set `site_url` and `display_url` in `public/admin/config.yml` to the new address.

To build for another host, set the address yourself:

```bash
SITE_URL=https://your-domain.example npm run build                       # site at the root of a domain
SITE_URL=https://example.org BASE_PATH=/new-contextualism npm run build  # site in a sub-folder
```

`SITE_URL` enables canonical URLs, social metadata, the XML sitemap and absolute addresses in the feed. Without it, none of these are generated. `BASE_PATH` is needed only when the site lives in a sub-folder: internal links go through `url()` in [`src/lib/url.ts`](src/lib/url.ts), which adds it. On Windows, run builds with a base path from PowerShell or set `MSYS_NO_PATHCONV=1` in Git Bash, which otherwise rewrites `/new-contextualism` as a Windows path.

### Editorial interface in production

`public/admin/config.yml` uses Decap's GitHub backend with the repository `shafi456/new-contextualism`.

1. Editors need write access to the repository.
2. GitHub Pages cannot sign editors in by itself, so sign-in goes through the Cloudflare Worker in `oauth-worker/` and the GitHub OAuth app "New Contextualism CMS". To change it, run `npx wrangler deploy` in that folder. The app's ID and secret are Worker secrets (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`), and if the site's address changes, update `SITE_ORIGIN` in `worker.js`.
3. To require approval before anything is published, uncomment `publish_mode: editorial_workflow`. Every change then becomes a pull request that an approver publishes.

## Before launch

- [ ] **Founder approval.** The philosophy text, the founder profile and the branding, including the tagline "Understanding Context. Reimagining Futures.", which is currently draft (`taglineApproved: false`).
- [ ] **Definitions awaited from the founder** for the names in the structure that no published source defines: New Contextual Urbanism, New Contextual Heritage Management (as a general framework), New Contextual Design Methodology, Contextual Intelligence, Syncretic Cultural History Theory and Ganga-Brahmaputra Civilization; and for the Plan and Process phases.
- [ ] **Verify the framework** against the founder's approved publications: the layer definitions, the research questions, the 26 relations, the order of the layers (the structure's order differs from the essays'), and the name "Scientific".
- [ ] **Confirm details where sources disagree:**
  - The Al-Cazaba location: Guadix or Almería.
  - Whether Chawk Bazar was a thesis or a studio project.
  - The publisher and date of the announced book, and of the guide for students listed as in progress.
- [ ] **People.** Name the editorial team (6.3), and decide whether an advisory network (6.4) will be formed.
- [ ] **Governance.** Approve or revise the proposed structure of five bodies on the Governance page; when a body is formed, publish its members and terms of reference there and update the pages that refer to it (6.3, 6.4, 6.6, 5.10 and the FAQ).
- [ ] **Founder portrait.** Add an approved portrait (`src/content/people/mohammad-habib-reza.md` → `portrait`).
- [ ] **Project images.** Obtain photographs and drawings of projects from their authors, with permission.
- [ ] **Contact email.** Set `contactEmail` in settings once confirmed; the Contact and Community Submissions pages adapt automatically.
- [ ] **Links.** Add institutional links and social accounts to settings only once they are verified and approved.
- [ ] **Policies.** Review the privacy, terms, copyright and accessibility statements, decide the licence for the platform's own texts and drawings, and add the hosting provider's details.
- [ ] **Domain.** Connect the custom domain (see [Custom domain](#custom-domain)).
- [ ] **Go live.** Set `prepublication: false` to remove the notice and allow search engines to index the site. The next push redeploys it.

## Notes for developers

- The project uses Astro 6, which supports this machine's Node 22.18. Astro 7 requires Node ≥ 22.22, and it includes security fixes for advisories that affect Astro 6. Those advisories concern server rendering and image processing; this site is static and processes only images added by trusted editors, so its exposure is limited. Upgrading is still recommended: upgrade Node, then run `npm install astro@^7`. The code avoids the features that change in Astro 7, and `compressHTML` is set explicitly.
- Drawings are deterministic. To change one, edit the generators in `src/lib/drawing/`, which use seeded randomness, so every build produces the same plates.
- Astro does not add the base path to redirect destinations; `astro.config.mjs` adds it.
