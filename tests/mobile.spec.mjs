// Phone-sized screen: menu opens, no horizontal scrolling on the homepage.
import {test, expect} from '@playwright/test';

test('mobile menu opens and shows the language switcher', async ({page}) => {
  await page.goto('/');
  await page.locator('.navbar__toggle').click();
  await expect(page.locator('.navbar-sidebar')).toBeVisible();
  await expect(page.locator('.navbar-sidebar')).toContainText(/Languages|Langues|English|Français/);
});

test('homepage has no horizontal scroll on mobile', async ({page}) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
