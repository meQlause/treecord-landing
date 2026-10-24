import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { COPY } from '../../src/features/landing/landing.copy';
import { jumpTo, onScreenBeats, railFill, settledFill } from '../helpers/story';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const SERIOUS = ['serious', 'critical'];
const KEY_PRESSES = 6;
const SETTLED = 0.99;
const TABS = 4;
const FOCUS_RING = 3; // px, the `--verified` ring on the calls to action

const isFocused = (locator: Locator) =>
  locator.evaluate((element) => element === document.activeElement);

const violations = async (page: Page) => {
  const { violations: found } = await new AxeBuilder({ page }).withTags(WCAG).analyze();

  return found
    .filter((violation) => SERIOUS.includes(violation.impact ?? ''))
    .map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(' | ')}`,
    );
};

test('the story has no serious accessibility violation at its first and last beat', async ({
  page,
}) => {
  await page.goto('/');
  await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).toEqual(['hero']);
  expect(await violations(page)).toEqual([]);

  await page.goto(jumpTo('roles', 1));
  await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).toEqual(['roles']);
  expect(await violations(page)).toEqual([]);
});

test('the article for reduced motion has no serious accessibility violation either', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#stage')).not.toHaveAttribute('data-motion');

  expect(await violations(page)).toEqual([]);
});

test('"Skip the story" is the first thing keyboard focus reaches, and it moves focus to the footer', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.pin-spacer').waitFor({ state: 'attached' });

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: COPY.shell.skip })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#end')).toBeFocused();
});

test('the headlines form one outline: the hook is the h1 and each beat opens with an h2', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.pin-spacer').waitFor({ state: 'attached' });

  const outline = await page
    .locator('h1, h2, h3')
    .evaluateAll((nodes) =>
      nodes.map((node) => [node.tagName, node.closest('section.beat')?.id ?? '']),
    );

  expect(outline).toEqual([
    ['H1', 'hero'],
    ['H2', 'seedling'],
    ['H2', 'problems'],
    ['H2', 'problems'],
    ['H2', 'problems'],
    ['H2', 'proof'],
    ['H2', 'pipeline'],
    ['H2', 'survival'],
    ['H2', 'carbon'],
    ['H2', 'roles'],
  ]);
});

test('the whole story is in the accessibility tree, not only the beat on screen', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.pin-spacer').waitFor({ state: 'attached' });

  const readable = await page
    .locator('section.beat')
    .evaluateAll((beats) => beats.map((beat) => getComputedStyle(beat).visibility));

  expect(readable.every((visibility) => visibility === 'visible')).toBe(true);
});

test('Page Down moves through the story with native scrolling', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pin-spacer').waitFor({ state: 'attached' });
  let last = 0;

  for (let press = 0; press < KEY_PRESSES; press += 1) {
    await page.keyboard.press('PageDown');
    const now = await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(last)
      .then(() => page.evaluate(() => window.scrollY));
    last = now;
  }

  expect(await settledFill(page)).toBeGreaterThan(0);
});

test('the calls to action show a 3 px focus ring when tabbed to', async ({ page }) => {
  await page.goto(jumpTo('roles', 1));
  await expect.poll(() => railFill(page), { timeout: 30_000 }).toBeGreaterThan(SETTLED); // the buttons are revealed at the very end
  const fund = page.locator('#roles a.btn--primary');
  await expect(fund).toBeVisible();

  for (let press = 0; press < TABS && !(await isFocused(fund)); press += 1) {
    await page.keyboard.press('Tab'); // the skip link comes first
  }

  await expect(fund).toBeFocused();
  const ring = await fund.evaluate((link) => parseFloat(getComputedStyle(link).outlineWidth));
  expect(ring).toBe(FOCUS_RING);
});
