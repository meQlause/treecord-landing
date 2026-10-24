// Paired screenshots for review by eye (L-2): the prototype and the app at the same scroll point.
// Output: test-results/fidelity/<viewport>/<beat>_<progress>_<prototype|app>.png
// A negative progress is partway through the camera move that brings the beat in.
import { expect, test } from '@playwright/test';
import { BEAT_IDS, jumpTo, settledFill, type BeatId } from '../helpers/story';

const INTRO = 9000; // ms since navigation: the forest grows in over 3.2 s once the page's modules and fonts are loaded
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1000x560', width: 1000, height: 560 },
  { name: '390x844', width: 390, height: 844 },
];
const TARGETS = [
  ['prototype', 'http://127.0.0.1:5180/landing/'],
  ['app', 'http://127.0.0.1:5178/'],
] as const;
const IN_BEAT = [0, 0.5, 1];
const IN_MOVE = -0.2;
const POINTS: [BeatId, number][] = [
  ...BEAT_IDS.flatMap((beat): [BeatId, number][] => IN_BEAT.map((progress) => [beat, progress])),
  ...BEAT_IDS.slice(1).map((beat): [BeatId, number] => [beat, IN_MOVE]),
];

for (const { name, width, height } of VIEWPORTS) {
  test.describe(name, () => {
    test.use({ viewport: { width, height } });

    for (const [beat, progress] of POINTS) {
      test(`${beat} at ${progress}`, async ({ page }) => {
        test.setTimeout(60_000);

        for (const [target, base] of TARGETS) {
          await page.goto(`${base}${jumpTo(beat, progress)}`);
          await expect(page.locator('canvas')).toHaveCount(1);
          await page.waitForFunction((since) => performance.now() > since, INTRO);
          await settledFill(page);
          await page.screenshot({
            path: `test-results/fidelity/${name}/${beat}_${progress}_${target}.png`,
          });
        }
      });
    }
  });
}
