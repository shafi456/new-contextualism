# New Contextualism — website

The digital platform, archive and research presence of **New Contextualism**, the architectural and urban design philosophy originated by Mohammad Habib Reza.

The site is built from [`WEBSITE DESIGN PROMPT — NEW CONTEXTUALISM.md`](./WEBSITE%20DESIGN%20PROMPT%20—%20NEW%20CONTEXTUALISM.md). It is a static site made with [Astro](https://astro.build), with content stored as Markdown and JSON files and an editorial interface ([Decap CMS](https://decapcms.org)) for editors who do not work with code.

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

## Content integrity

The brief requires that nothing be invented. The site enforces this in three ways.

1. **Provenance labels.** Every substantial text records where it comes from: *published source*, *editorial summary*, *proposed statement*, *approved by the founder*, or *interpretation*. Labels are shown on the page and explained at `/editorial-standards/`.
2. **Citations.** Texts cite records by file name, for example `[@reza-2025-deltaic-bangladesh]`. These become author–date links (Chicago style) to a bibliography on the same page. **An unknown citation key fails the build.**
3. **Reference checks.** Dimensions, sources, events and records referenced anywhere must exist, or the build fails with a list of broken references (`src/lib/content.ts`).

### What the content is based on

All factual content comes from published sources, which were consulted on 19 October 2026 and are listed in the archive with links.

- **Writing on New Contextualism.** Essays in *The Business Standard* (Reza 2023), *The Daily Star* (Reza 2025) and *Context BD* (Reza and Nitu 2025).
- **Events.** BRAC University's and Arch-Bangla's reports of the June 2023 workshop, and Context BD's listings of the 2024 workshop and the 2025 symposium.
- **Founder.** His BRAC University faculty profile, his ArCHIAM team profile and the UIA 2023 speaker page.

Quotations were checked word for word against the original articles. Where sources disagree (dates, the Al-Cazaba's location, the spiritual/political layer), the site says so rather than choosing silently.

### What is editorial, and needs review

- **Dimension definitions and research questions.** Editorial summaries built on the founder's own terms for each dimension.
- **The 26 relations between dimensions.** An editorial interpretation; 20 are illustrated with examples from the published record. Stored in `src/content/framework/relations.json`.
- **Proposed mission and vision**, and the description of how dialogue and contributions work.
- **The privacy and accessibility statements.** Drafts.

### Images

No photographs were available with permission, so projects and dimensions are illustrated with **original abstract drawings**. These are generated at build time (`src/lib/drawing/`) and served from `/plates/*.svg`. Each is tagged "Abstract plate" or "Editorial diagram" and captioned as not depicting the project or a real site. When a project's authors supply images, add them in the editor (*Projects → Cover image*). Alternative text and a credit are required, and the image replaces the plate automatically. Context BD states that its articles are published under CC BY 4.0, but confirm permission with the designers before using any project images from there.

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
| Site settings: tagline, pre-publication flag, contact email, links, mission and vision | `src/content/site/settings.json` |
| Chronology | `src/content/site/chronology.json` |
| Relations between dimensions | `src/content/framework/relations.json` |
| The ten dimensions | `src/content/dimensions/*.md` |
| Philosophy, eight sections | `src/content/philosophy/*.md` |
| Projects | `src/content/projects/*.md` |
| Archive records, references and sources | `src/content/publications/*.md` |
| Events | `src/content/events/*.md` |
| Founder profile | `src/content/people/*.md` |
| Policy pages | `src/content/pages/*.md` |

Schemas are in `src/content.config.ts`, and the editor's fields are in `public/admin/config.yml`. Keep the two in step.

**Useful fields**

- `draft: true`: the entry is hidden in production builds.
- `archived: true`: the entry keeps its address but leaves listings.
- `approval: approved`: once the founder has approved a text, set this and change the provenance to `founder-approved` where appropriate.

**Persistent addresses:** `/research/{file-name}/`, `/projects/{file-name}/`, `/framework/{dimension}/`. Do not rename files once published.

---

## Site map

| Page | Contents |
| --- | --- |
| `/` | Homepage sections A–I from the brief |
| `/movement/` | What the approach proposes; principles in three published formulations; New Contextualism 2.0; origins and chronology; proposed mission and vision |
| `/philosophy/` | The eight-part account, with diagrams and a bibliography |
| `/framework/` | Interactive contextual diagram and relations matrix; a page for each dimension at `/framework/{id}/` |
| `/projects/` | Projects grouped by status (completed, ongoing, conceptual); `/projects/{id}/` for each |
| `/research/` | Filterable archive (type, author, year, dimension, topic, collection; filters are kept in the URL); `/research/{id}/` for each record, with Chicago, APA and BibTeX citations |
| `/about/` | The platform, the founder's profile, contributors to the public record, editorial governance |
| `/dialogue/` | Research contributions, collaborations, lectures, calls for papers, events |
| `/contact/`, `/privacy/`, `/accessibility/`, `/editorial-standards/` | Contact, policy and governance pages |
| `/search/` | Site search (also opened from the header, or with the `/` key) |

Search runs in the browser against `/search-index.json`, which is generated at build time. Nothing is sent to a server.

## Design system

- **Colour.** The palette is from the brief, defined as tokens in `src/styles/global.css`. The brief's soft grey `#88877F` is only 3.1:1 against the paper colour, so it is used only for rules, drawings and large text. Small text uses `--ink-2: #65645D` (5.2:1), which meets WCAG AA. Brick red is limited to focus rings, selection states and section lines.
- **Type.** Instrument Serif for headings and Inter for text, both self-hosted through Fontsource, so no requests go to third parties.
- **Grid.** 12 columns, with fluid gutters and type scale.
- **Accessibility.** Includes a skip link, visible focus and semantic landmarks, and diagrams have text equivalents. The framework diagram is an ARIA tablist operated with the arrow keys, Home and End, and its relations matrix is an accessible table. Motion respects `prefers-reduced-motion`, and the site works without JavaScript.

## Deployment

The site is published with **GitHub Pages** at <https://shafi456.github.io/new-contextualism/>. Every push to `main` rebuilds and redeploys it through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml); you can follow progress in the repository's **Actions** tab.

The workflow reads the address and base path from the Pages settings, so a custom domain needs no code change. Add it under *Settings → Pages → Custom domain*, and the next deployment serves the site from the root of that domain.

To build for another host, set the address yourself:

```bash
SITE_URL=https://your-domain.example npm run build                       # site at the root of a domain
SITE_URL=https://example.org BASE_PATH=/new-contextualism npm run build  # site in a sub-folder
```

`SITE_URL` enables canonical URLs, social metadata and the XML sitemap. Without it, none of these are generated. `BASE_PATH` is needed only when the site lives in a sub-folder: internal links go through `url()` in [`src/lib/url.ts`](src/lib/url.ts), which adds it.

### Editorial interface in production

`public/admin/config.yml` uses Decap's GitHub backend with the repository `shafi456/new-contextualism`.

1. Editors need write access to the repository.
2. GitHub Pages cannot sign editors in by itself, so Decap needs an OAuth provider. Netlify provides one built in; on other hosts you can run a small OAuth proxy (see Decap's documentation on external OAuth clients). Until then, edit locally with `npm run cms` and push the changes.
3. To require approval before anything is published, uncomment `publish_mode: editorial_workflow`. Every change then becomes a pull request that an approver publishes.

## Before launch

- [ ] **Founder approval.** The philosophy text, the founder profile and the branding, including the tagline "Understanding Context. Reimagining Futures.", which is currently draft (`taglineApproved: false`).
- [ ] **Verify the framework** against the founder's approved publications. This covers the dimension definitions, the research questions, the 26 relations, and whether the sixth dimension is called "Scientific" or "Scientific and Technological".
- [ ] **Confirm details where sources disagree:**
  - The Al-Cazaba location: Guadix or Almería.
  - Whether Chawk Bazar was a thesis or a studio project.
  - The publisher and date of the announced book.
- [ ] **Founder portrait.** Add an approved portrait (`src/content/people/mohammad-habib-reza.md` → `portrait`).
- [ ] **Project images.** Obtain photographs and drawings of projects from their authors, with permission.
- [ ] **Contact email.** Set `contactEmail` in settings once confirmed; the Contact page adapts automatically.
- [ ] **Links.** Add institutional links and social accounts to settings only once they are verified and approved.
- [ ] **Policies.** Review the privacy and accessibility statements, and add the hosting provider's details.
- [ ] **Go live.** Set `prepublication: false` to remove the notice and allow search engines to index the site. The next push redeploys it.

## Notes for developers

- The project uses Astro 6, which supports this machine's Node 22.18. Astro 7 requires Node ≥ 22.22, and it includes security fixes for advisories that affect Astro 6. Those advisories concern server rendering and image processing; this site is static and processes only images added by trusted editors, so its exposure is limited. Upgrading is still recommended: upgrade Node, then run `npm install astro@^7`. The code avoids the features that change in Astro 7, and `compressHTML` is set explicitly.
- Drawings are deterministic. To change one, edit the generators in `src/lib/drawing/`, which use seeded randomness, so every build produces the same plates.
