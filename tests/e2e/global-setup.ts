import { chromium } from '@playwright/test';

const APP = 'http://127.0.0.1:5178/';
const LOADS = 2;

/**
 * Warms the dev server before any test. On a fresh machine (CI) Vite optimises dependencies as the page first
 * asks for them and can reload the page when it finds new ones, which rewinds the story under a running test.
 * Loading the page twice, each time to a fully built story, settles that before the first test starts.
 */
export default async function warmUp(): Promise<void> {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  for (let load = 0; load < LOADS; load += 1) {
    await page.goto(APP);
    await page.locator('.pin-spacer').waitFor({ state: 'attached', timeout: 120_000 });
    await page.waitForLoadState('networkidle');
  }
  await browser.close();
}
