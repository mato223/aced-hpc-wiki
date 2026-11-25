# IGH HPC Wiki

Documentation site for the High Performance Computing cluster of the
**Institute of Genomics and Global Health (IGH)**, formerly ACEGID.

Built with [Docusaurus 3](https://docusaurus.io/). Bilingual: **English** (default, served at `/`)
and **French** (served at `/fr/`), switchable from the language menu in the top bar.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm start          # full site, both languages, as in production → http://localhost:3000
npm run dev        # live-reload editing, English only
npm run dev:fr     # live-reload editing, French only → http://localhost:3000/fr/
npm test           # automated browser tests (see below)
```

> `npm run dev` serves **one language at a time** (a Docusaurus limitation), so the
> language switcher leads to an explanation page there. Use `npm start` to see
> the real bilingual site.

## Tests

`npm test` builds the site and runs [Playwright](https://playwright.dev/) browser tests (`tests/`):

- every page in both languages loads with no JS error, no failed request, no broken image
- walking through all docs with "Next" (client-side navigation) produces no error
- sidebar, homepage, navbar and footer links all resolve
- language switch EN ↔ FR keeps you on the same page; French UI is translated
- search returns results in both languages; dark mode toggle; 404 page
- mobile: menu opens, no horizontal scroll

`npm run test:report` opens the HTML report of the last run.
First time on a new machine: `npx playwright install chromium`.

## Where things live

| What | Where |
|---|---|
| Institute / cluster values (hostname, support, hours, QOS limits, scratch purge…) | `src/data/site.js` |
| English pages | `docs/` |
| French pages | `i18n/fr/docusaurus-plugin-content-docs/current/` (same file paths as `docs/`) |
| Sidebar category names (EN) | `_category_.json` in each `docs/` folder |
| Sidebar category names (FR) | `i18n/fr/docusaurus-plugin-content-docs/current.json` |
| Homepage text (FR) | `i18n/fr/code.json` |
| Navbar / footer text (FR) | `i18n/fr/docusaurus-theme-classic/` |
| Colours, fonts | `src/css/custom.css` (brand variables at the top) |
| Logo, favicon, link preview | `static/img/igh-logo.png`, `igh-favicon.png`, `social-card.png`, `static/favicon.ico` (generated from `igh-logo-original.jpeg`) |

## Writing content

### Add a page

1. Create `docs/<section>/<page>.md` with front matter:
   ```md
   ---
   id: my-page
   title: My page title
   sidebar_label: Short label
   sidebar_position: 3
   ---
   ```
2. Create the French version at the **same path** under
   `i18n/fr/docusaurus-plugin-content-docs/current/`, translating `title`,
   `sidebar_label` and the body. Keep `id` and `sidebar_position` identical.

The sidebar is generated from the folders — no need to edit `sidebars.js`.
If the French file doesn't exist yet, French readers see the English page, so
English can be published first.

### Add a section

Create a folder in `docs/` with a `_category_.json` (label, position,
description), then add the French label to `current.json`
(`npm run write-translations` adds the missing keys for you).

### Use shared values instead of hard-coding them

Hostnames, emails and hours are defined once in `src/data/site.js`:

```mdx
Contact <Var name="supportEmail" link /> — log in to <Var name="loginHost" code />.

<SiteCode language="bash" code="ssh username@{loginHost}" />
```

`Var`, `SiteCode`, `Tabs` and `TabItem` are available in every page without importing.

### Other tools available in pages

- Admonitions: `:::note`, `:::tip`, `:::info`, `:::warning`, `:::danger`
- Diagrams with Mermaid: a ` ```mermaid ` code block
- Tabs (e.g. Linux / macOS / Windows), synced across the page with `groupId`

## Before going live — TODO

- [ ] Set `url` / `baseUrl` in `docusaurus.config.js` once the wiki is hosted
- [ ] Set `githubOrg` / `githubRepo` in `src/data/site.js` ("Edit this page" links)
- [ ] Confirm the final QOS limits (values in `src/data/site.js` are not final)
- [ ] Update the year in the French footer copyright (`i18n/fr/docusaurus-theme-classic/footer.json`)
- [ ] Review the points marked "To be confirmed" / "À confirmer" in the pages
