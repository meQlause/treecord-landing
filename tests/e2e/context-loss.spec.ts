import { expect, test } from '@playwright/test';
import { onScreenBeats } from '../helpers/story';

const SCROLL_SHARE = 0.3;

test('losing the WebGL context falls back to the paper background and the story still scrolls', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#stage .gl canvas')).toHaveCount(1);
  await page.locator('.pin-spacer').waitFor({ state: 'attached' });

  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#stage .gl canvas');
    canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  });

  await expect(page.locator('#stage .gl')).toHaveClass(/gl-lost/);
  await expect(page.locator('#stage .gl canvas')).toBeHidden();

  await page.evaluate((share) => {
    window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * share);
  }, SCROLL_SHARE);

  await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).not.toEqual(['hero']);
});
