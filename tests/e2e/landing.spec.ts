import { expect, test, type Page } from '@playwright/test';
import { BEAT_IDS, jumpTo, onScreenBeats, railFill, settledFill } from '../helpers/story';

const SCROLL_STEPS = 12;
const FILL_TOLERANCE = 0.001;

const collectProblems = (page: Page): string[] => {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      problems.push(message.text());
    }
  });

  return problems;
};

test('the stage mounts with a 3D canvas and the first beat, without console errors', async ({
  page,
}) => {
  const problems = collectProblems(page);

  await page.goto('/');

  await expect(page.locator('#stage .gl canvas')).toHaveCount(1);
  await expect(page.locator('#hero')).toBeVisible();
  expect(problems).toEqual([]);
});

for (const beat of BEAT_IDS) {
  test(`${beat} is the one beat on screen in the middle of its time`, async ({ page }) => {
    await page.goto(jumpTo(beat, 0.5));

    await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).toEqual([beat]);
  });
}

test('scrolling top to bottom grows the progress bar steadily and logs no error', async ({
  page,
}) => {
  const problems = collectProblems(page);
  await page.goto('/');
  await page.locator('.pin-spacer').waitFor({ state: 'attached' }); // the story's scroll length exists once it is pinned
  const reach = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  let last = 0;

  for (let step = 1; step <= SCROLL_STEPS; step += 1) {
    await page.evaluate((top) => window.scrollTo(0, top), (reach * step) / SCROLL_STEPS);
    const fill = await settledFill(page);
    expect(fill).toBeGreaterThanOrEqual(last - FILL_TOLERANCE);
    last = fill;
  }

  await expect.poll(() => railFill(page), { timeout: 15_000 }).toBeGreaterThan(1 - FILL_TOLERANCE);
  expect(problems).toEqual([]);
});

test('the last beat offers the two ways in: fund a tree and become a planter', async ({ page }) => {
  await page.goto(jumpTo('roles', 1));
  await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).toEqual(['roles']);

  const links = await page
    .locator('#roles a.btn')
    .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')));

  expect(links).toEqual(['/#/campaigns', '/#/sign-in?account=planter&returnTo=%2Fapp']);
});
