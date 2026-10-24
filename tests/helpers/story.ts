import { expect, type Page } from '@playwright/test';

export const BEAT_IDS = [
  'hero',
  'seedling',
  'problems',
  'proof',
  'pipeline',
  'survival',
  'carbon',
  'roles',
] as const;

export type BeatId = (typeof BEAT_IDS)[number];

/** The development review jump: a beat and a progress within it (?at=survival,0.5). */
export const jumpTo = (beat: BeatId, progress: number): string => `?at=${beat},${progress}`;

/** Beats that are actually on screen: shown, not faded out, and centred in the viewport (pans park the rest aside). */
export const onScreenBeats = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.beat')]
      .filter((beat) => {
        const style = getComputedStyle(beat);
        const box = beat.getBoundingClientRect();
        const centre = box.left + box.width / 2;

        return (
          style.visibility !== 'hidden' &&
          Number(style.opacity) > 0.5 &&
          centre > 0 &&
          centre < innerWidth
        );
      })
      .map((beat) => beat.id),
  );

/** The progress bar's fill, 0..1. */
export const railFill = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const rail = document.querySelector('.rail');

    return rail ? new DOMMatrix(getComputedStyle(rail).transform).a : 0;
  });

const POLL_EVERY = 150;

/** The rail's fill once the scroll trigger's scrub has caught up: two reads in a row agree. */
export async function settledFill(page: Page): Promise<number> {
  let previous = -1;
  await expect
    .poll(
      async () => {
        const fill = await railFill(page);
        const settled = fill === previous;
        previous = fill;

        return settled;
      },
      { intervals: [POLL_EVERY] },
    )
    .toBe(true);

  return previous;
}
