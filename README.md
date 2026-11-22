# IGH HPC Wiki

Documentation site for the High Performance Computing cluster of the
**Institute of Genomics and Global Health (IGH)**, formerly ACEGID.

Built with [Docusaurus 3](https://docusaurus.io/). Bilingual: **English** (default, served at `/`)
and **French** (served at `/fr/`), switchable from the language menu in the top bar.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm start          # English dev server  → http://localhost:3000
npm run start:fr   # French dev server   → http://localhost:3000/fr/
npm run build      # builds both languages into ./build
npm run serve      # serve the build (language switch works here)
```

> The dev server only serves one language at a time. To test the language
> switcher end to end, use `npm run build && npm run serve`.

## Where things live

| What | Where |
|---|---|
| Institute / cluster values (hostnames, emails, hours…) | `src/data/site.js` |
| English pages | `docs/` |
| French pages | `i18n/fr/docusaurus-plugin-content-docs/current/` (same file paths as `docs/`) |
| Sidebar category names (EN) | `_category_.json` in each `docs/` folder |
| Sidebar category names (FR) | `i18n/fr/docusaurus-plugin-content-docs/current.json` |
| Homepage text (FR) | `i18n/fr/code.json` |
| Navbar / footer text (FR) | `i18n/fr/docusaurus-theme-classic/` |
| Colours, fonts | `src/css/custom.css` (brand variables at the top) |
| Logo, favicon | `static/img/logo.svg`, `static/img/favicon.svg` |

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

- [ ] Fill in real values in `src/data/site.js` (login host, support email, forms, GitHub org)
- [ ] Set `url` / `baseUrl` in `docusaurus.config.js` for the chosen hosting
- [ ] Replace placeholder logo/favicon and brand colours with the official IGH identity
- [ ] Add `static/img/social-card.png` (link preview image, 1200×630)
- [ ] Update the year in the French footer copyright (`i18n/fr/docusaurus-theme-classic/footer.json`)
- [ ] Replace the "Content coming soon" placeholders
