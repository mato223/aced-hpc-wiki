// Every page, in both languages, loads cleanly.
import {test, expect} from '@playwright/test';
import {allPaths, watchErrors} from './helpers.mjs';

const paths = allPaths();

test('sitemap lists pages in both languages', () => {
  expect(paths.filter((p) => !p.startsWith('/fr')).length).toBeGreaterThan(30);
  expect(paths.filter((p) => p.startsWith('/fr')).length).toBeGreaterThan(30);
});

for (const p of paths) {
  test(`page loads without errors: ${p}`, async ({page}) => {
    const errors = watchErrors(page);
    const res = await page.goto(p, {waitUntil: 'networkidle'});
    expect(res.status()).toBe(200);
    await expect(page).not.toHaveTitle(/Page Not Found|Page introuvable/);
    await expect(page.locator('h1').first()).toBeVisible();

    const expectedLang = p.startsWith('/fr') ? 'fr-FR' : 'en-GB';
    await expect(page.locator('html')).toHaveAttribute('lang', expectedLang);

    // no broken images
    const broken = await page.$$eval('main img', (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken, 'broken images').toEqual([]);

    expect(errors, 'JS errors / failed requests').toEqual([]);
  });
}
