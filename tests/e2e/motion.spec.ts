import { expect, test, type Page } from '@playwright/test';
import { onScreenBeats, settledFill } from '../helpers/story';

const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 1000, height: 560 };
const PHONE = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };

const stageReady = (page: Page) => page.locator('.pin-spacer').waitFor({ state: 'attached' });
const pinHeight = (page: Page) =>
  page.evaluate(() => document.querySelector('.pin-spacer')?.getBoundingClientRect().height ?? 0);
const markLayers = (page: Page) => page.locator('.fx-layer').count();
const loadedAt = (page: Page) => page.evaluate(() => performance.timeOrigin);

test('turning reduced motion on and off while the page is open swaps the story and the article', async ({
  page,
}) => {
  await page.goto('/');
  await stageReady(page);
  await expect(page.locator('#stage')).toHaveAttribute('data-motion', '');

  await page.emulateMedia({ reducedMotion: 'reduce' });

  await expect(page.locator('#stage')).not.toHaveAttribute('data-motion');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect.poll(() => onScreenBeats(page)).toContain('roles');

  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await expect(page.locator('#stage')).toHaveAttribute('data-motion', '');
  await stageReady(page);
  await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).toEqual(['hero']);
});

test('resizing re-measures the words and marks without reloading the page', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/');
  await stageReady(page);
  const origin = await loadedAt(page);
  const layers = await markLayers(page);

  await page.setViewportSize(NARROW);

  await expect.poll(() => markLayers(page), { timeout: 15_000 }).toBe(layers);
  await stageReady(page);
  expect(await loadedAt(page)).toBe(origin);
  await expect(page.locator('.say .fx-layer')).not.toHaveCount(0);
});

test('rotating a phone recomputes how far the story scrolls', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await stageReady(page);
  const portrait = await pinHeight(page);

  await page.setViewportSize(PHONE_LANDSCAPE);

  await expect.poll(() => pinHeight(page), { timeout: 15_000 }).toBeLessThan(portrait);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).toEqual(['roles']);
  expect(await settledFill(page)).toBeGreaterThan(0.99);
});

test('the hook greets on load, before any scroll', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.hook .say .w').first()).toBeVisible();
  await expect.poll(() => page.locator('.hook .say .fx-layer svg').count()).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
