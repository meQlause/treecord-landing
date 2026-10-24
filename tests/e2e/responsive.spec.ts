import { expect, test, type Page } from '@playwright/test';
import { BEAT_IDS, jumpTo, onScreenBeats, settledFill, type BeatId } from '../helpers/story';

const SMALLEST = { width: 360, height: 740 };
const LARGEST = { width: 1920, height: 1080 };
const TABLET_LANDSCAPE = { width: 1000, height: 560 };
const PHONE = { width: 390, height: 844 };
const PIPELINE_SHARE = 0.4; // the pipeline is at most 40% of the screen height
const SLACK = 1; // px
const LOOP_TIMEOUT = 120_000;

const showMiddleOf = async (page: Page, beat: BeatId) => {
  await page.goto(jumpTo(beat, 0.5));
  await page.locator('.pin-spacer').waitFor({ state: 'attached' });
  await settledFill(page);
  await expect.poll(() => onScreenBeats(page), { timeout: 15_000 }).toEqual([beat]);
};

const pageOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

for (const [name, size] of [
  ['360 px', SMALLEST],
  ['1920 px', LARGEST],
] as const) {
  test(`no beat makes the page scroll sideways at ${name}`, async ({ page }) => {
    test.setTimeout(LOOP_TIMEOUT); // eight beats of software-rendered WebGL
    await page.setViewportSize(size);

    for (const beat of BEAT_IDS) {
      await showMiddleOf(page, beat);

      expect(await pageOverflow(page), beat).toBeLessThanOrEqual(0);
    }
  });
}

test('on a short landscape tablet the pipeline is height-bound and stays below its headline', async ({
  page,
}) => {
  await page.setViewportSize(TABLET_LANDSCAPE);
  await showMiddleOf(page, 'pipeline');

  const edges = await page.evaluate(() => {
    const rect = (selector: string) =>
      (document.querySelector(selector) as Element).getBoundingClientRect();

    return {
      svgHeight: rect('#pipeline .tc-pipeline').height,
      svgTop: rect('#pipeline .tc-pipeline').top,
      copyBottom: rect('#pipeline .copy').bottom,
    };
  });
  const { svgHeight, svgTop, copyBottom } = edges;

  expect(svgHeight).toBeLessThanOrEqual(TABLET_LANDSCAPE.height * PIPELINE_SHARE + SLACK);
  expect(svgTop).toBeGreaterThanOrEqual(copyBottom - SLACK);
});

test('a headline always sits above a glass panel, so the blur never falls on its words', async ({
  page,
}) => {
  await page.setViewportSize(TABLET_LANDSCAPE);
  await showMiddleOf(page, 'survival');

  const order = await page.evaluate(() => {
    const layer = (selector: string) =>
      Number(getComputedStyle(document.querySelector(selector) as Element).zIndex);

    return { copy: layer('#survival .copy'), glass: layer('#survival .glass') };
  });

  expect(order.copy).toBeGreaterThan(order.glass);
});

test('on a phone the two-column beats become one column', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await showMiddleOf(page, 'proof');

  const columns = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector('#proof') as Element).gridTemplateColumns.split(' ')
        .length,
  );

  expect(columns).toBe(1);
});
