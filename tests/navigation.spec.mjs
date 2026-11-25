// In-app (client-side) navigation and the language switcher.
import {test, expect} from '@playwright/test';
import {watchErrors} from './helpers.mjs';

for (const locale of ['', '/fr']) {
  test(`walk all docs with "Next" without errors (${locale || 'en'})`, async ({page}) => {
    const errors = watchErrors(page);
    await page.goto(`${locale}/docs/intro`, {waitUntil: 'networkidle'});
    await page.evaluate(() => { window.__walkMarker = true; });
    const visited = new Set([page.url()]);
    for (let i = 0; i < 100; i++) {
      const next = page.locator('a.pagination-nav__link--next');
      if ((await next.count()) === 0) break;
      const href = await next.getAttribute('href');
      const target = href.replace(/\/$/, '');
      // native click → handled by the client-side router (no full page reload)
      await page.evaluate((h) => document.querySelector(`a.pagination-nav__link--next[href="${h}"]`).click(), href);
      await expect.poll(() => new URL(page.url()).pathname.replace(/\/$/, '')).toBe(target);
      // wait until the new page is rendered (its "Next" link is no longer the one we clicked)
      await expect.poll(() => page.evaluate(() =>
        document.querySelector('a.pagination-nav__link--next')?.getAttribute('href') ?? null)).not.toBe(href);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page).not.toHaveTitle(/Page Not Found|Page introuvable/);
      visited.add(page.url());
    }
    expect(visited.size).toBeGreaterThan(30);
    // still the same document: navigation stayed client-side
    expect(await page.evaluate(() => window.__walkMarker)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('sidebar links all lead to real pages', async ({page}) => {
  const errors = watchErrors(page);
  await page.goto('/docs/intro');
  // expand every collapsed category
  for (let i = 0; i < 5; i++) {
    const collapsed = page.locator('.theme-doc-sidebar-menu .menu__list-item--collapsed > div > a, .theme-doc-sidebar-menu .menu__list-item--collapsed > a');
    if ((await collapsed.count()) === 0) break;
    await collapsed.first().click();
  }
  const hrefs = await page.$$eval('.theme-doc-sidebar-menu a.menu__link[href]', (as) =>
    [...new Set(as.map((a) => a.getAttribute('href')))]);
  expect(hrefs.length).toBeGreaterThan(5);
  for (const h of hrefs) {
    const res = await page.request.get(h);
    expect(res.status(), h).toBe(200);
  }
  expect(errors).toEqual([]);
});

test('homepage cards, navbar and footer links work', async ({page}) => {
  await page.goto('/');
  const hrefs = await page.$$eval('a[href^="/"]', (as) =>
    [...new Set(as.map((a) => a.getAttribute('href')))]);
  for (const h of hrefs) {
    const res = await page.request.get(h);
    expect(res.status(), h).toBe(200);
  }
});

async function switchLanguage(page, label) {
  await page.locator('.navbar__items--right .dropdown').filter({has: page.locator('.dropdown__menu')}).first().hover();
  await page.locator('.dropdown__menu a', {hasText: label}).first().click();
}

test('language switch EN → FR keeps the same page', async ({page}) => {
  await page.goto('/docs/getting-started/accounts');
  await switchLanguage(page, 'Français');
  await expect(page).toHaveURL(/\/fr\/docs\/getting-started\/accounts\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
  await expect(page).not.toHaveTitle(/Page Not Found|Page introuvable/);
  // UI is translated even when the page content is not yet
  await expect(page.locator('.navbar')).toContainText('Démarrage rapide');
});

test('language switch FR → EN keeps the same page', async ({page}) => {
  await page.goto('/fr/docs/hardware/storage');
  await switchLanguage(page, 'English');
  await expect(page).toHaveURL(/\/docs\/hardware\/storage\/?$/);
  await expect(page).not.toHaveURL(/\/fr\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
});

test('French homepage and sidebar are translated', async ({page}) => {
  await page.goto('/fr/');
  await expect(page.locator('main')).toContainText('Par où voulez-vous commencer');
  await expect(page.locator('footer')).toContainText('Obtenir de l\'aide');
  await page.goto('/fr/docs/intro');
  const sidebar = page.locator('.theme-doc-sidebar-menu');
  await expect(sidebar).toContainText('Prise en main');
  await expect(sidebar).toContainText('Bonnes pratiques');
});

for (const [locale, query] of [['', 'slurm'], ['/fr', 'slurm']]) {
  test(`search returns results (${locale || 'en'})`, async ({page}) => {
    await page.goto(`${locale}/docs/intro`, {waitUntil: 'networkidle'});
    const input = page.locator('.navbar input.navbar__search-input').first();
    await input.fill(query);
    const result = page.locator('[role="listbox"] [role="option"], .dropdownMenu a, [class*="suggestion"]').first();
    await expect(result).toBeVisible({timeout: 15_000});
  });
}

test('dark mode toggle works', async ({page}) => {
  await page.goto('/');
  const html = page.locator('html');
  const toggle = page.locator('.navbar button[class*="toggleButton"]').first();
  // the toggle cycles system → light → dark
  for (let i = 0; i < 3 && (await html.getAttribute('data-theme')) !== 'dark'; i++) {
    await toggle.click();
  }
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('unknown page shows a 404', async ({page}) => {
  await page.goto('/docs/this-page-does-not-exist');
  await expect(page.locator('h1').first()).toHaveText(/Page Not Found|Page introuvable/);
});
