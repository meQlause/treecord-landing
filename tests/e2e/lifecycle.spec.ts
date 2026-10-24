import { expect, test, type Page } from '@playwright/test';

const SWITCHES = 5; // reduced motion on and off: each swap throws away the 3D stage and builds a new one
const HEAP_GROWTH_MB = 30;
const BYTES_PER_MB = 1_000_000;

const stageReady = (page: Page) => page.locator('.pin-spacer').waitFor({ state: 'attached' });

const heapUsed = async (page: Page): Promise<number> => {
  const session = await page.context().newCDPSession(page);
  await session.send('HeapProfiler.collectGarbage');
  const { usedSize } = await session.send('Runtime.getHeapUsage');
  await session.detach();

  return usedSize;
};

test('throwing away and rebuilding the stage repeatedly leaves one canvas, one pin and no heap growth', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await stageReady(page);
  await expect(page.locator('#stage .gl canvas')).toHaveCount(1);
  const before = await heapUsed(page);

  for (let swap = 0; swap < SWITCHES; swap += 1) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('#stage .gl canvas')).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await stageReady(page);
    await expect(page.locator('#stage .gl canvas')).toHaveCount(1);
  }

  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await expect(page.locator('#stage .gl')).not.toHaveClass(/gl-lost/);
  expect((await heapUsed(page)) - before).toBeLessThan(HEAP_GROWTH_MB * BYTES_PER_MB);
});
