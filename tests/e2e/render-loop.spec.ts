import { expect, test, type Page } from '@playwright/test';

const SHORT = { width: 1000, height: 100 }; // shorter than the footer, so the stage can scroll fully out of view
const POLL_EVERY = 200;

type Counted = { __draws: number };

/** Counts every WebGL draw call the page makes: one per frame the 3D stage renders, per mesh. */
const countDraws = (page: Page) =>
  page.addInitScript(() => {
    const counted = window as unknown as Counted;
    counted.__draws = 0;
    const proto = WebGL2RenderingContext.prototype as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >;
    for (const name of [
      'drawElements',
      'drawArrays',
      'drawElementsInstanced',
      'drawArraysInstanced',
    ]) {
      const original = proto[name];
      proto[name] = function (this: unknown, ...args: unknown[]) {
        counted.__draws += 1;

        return original.apply(this, args);
      };
    }
  });

const draws = (page: Page) => page.evaluate(() => (window as unknown as Counted).__draws);

/** The count once it stops changing between two looks (the loop has stopped). */
async function stoppedAt(page: Page): Promise<number> {
  let previous = -1;
  await expect
    .poll(
      async () => {
        const now = await draws(page);
        const same = now === previous;
        previous = now;

        return same;
      },
      { intervals: [POLL_EVERY], timeout: 15_000 },
    )
    .toBe(true);

  return previous;
}

test('the 3D stage draws only while it is on screen', async ({ page }) => {
  await countDraws(page);
  await page.setViewportSize(SHORT);
  await page.goto('/');
  await page.locator('.pin-spacer').waitFor({ state: 'attached' });
  const onScreen = await draws(page);
  await expect.poll(() => draws(page)).toBeGreaterThan(onScreen);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const stopped = await stoppedAt(page);
  await page.evaluate(() => window.scrollTo(0, 0));

  await expect.poll(() => draws(page), { timeout: 15_000 }).toBeGreaterThan(stopped);
});
