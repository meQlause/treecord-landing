import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import {
  PHONE_SCREEN_VIEWBOX,
  PROOF_ROWS,
  phoneSVG,
  phoneTimeline,
} from '../../../../src/shared/art/phone';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

describe('phone', () => {
  const root = mount(phoneSVG());

  it('is a decorative 320 x 600 svg with the screen clipped to its rounded corners', () => {
    expect(root.getAttribute('class')).toBe('tc-phone');
    expect(root.getAttribute('viewBox')).toBe('0 0 320 600');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('clipPath#tc-screen')).not.toBeNull();
    expect(root.querySelectorAll('.phone')).toHaveLength(1);
  });

  it('frames the recording: four corner brackets, a REC light and a proof panel', () => {
    expect(root.querySelectorAll('.bracket')).toHaveLength(4);
    expect(root.querySelectorAll('.rec circle')).toHaveLength(1);
    expect(root.querySelector('.rec')?.textContent).toBe('REC');
    expect(root.querySelectorAll('.panel')).toHaveLength(1);
  });

  it('shows the sample proof values, each row empty until its text is scrambled in', () => {
    const rows = [...root.querySelectorAll('.row')];

    expect(PROOF_ROWS).toHaveLength(3);
    expect(rows.map((row) => row.getAttribute('data-text'))).toEqual(PROOF_ROWS);
    expect(rows.every((row) => row.textContent === '')).toBe(true);
  });

  it('shows whatever proof rows it is given', () => {
    const custom = mount(phoneSVG({ rows: ['GPS  1,2  ±3 m', 'TIME 2026-01-01 00:00:00'] }));

    expect(
      [...custom.querySelectorAll('.row')].map((row) => row.getAttribute('data-text')),
    ).toEqual(['GPS  1,2  ±3 m', 'TIME 2026-01-01 00:00:00']);
  });

  it("has a screen crop with the phone's own aspect, so a viewBox zoom never letterboxes", () => {
    const [, , width, height] = PHONE_SCREEN_VIEWBOX.split(' ').map(Number);

    expect(width / height).toBeCloseTo(320 / 600, 2);
  });

  it('draws the same way twice', () => {
    expect(phoneSVG()).toBe(phoneSVG());
  });

  it('builds a paused timeline of at least 1 that scrambles each row in, one after another', () => {
    const built = mount(phoneSVG());
    const timeline = phoneTimeline(built);
    const scrambles = tweens(timeline).filter((tween) => 'scrambleText' in (tween.vars as object));
    const starts = scrambles.map((tween) => tween.startTime());

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(scrambles).toHaveLength(3);
    expect(starts).toEqual([...starts].sort((first, second) => first - second));
    expect(
      scrambles.map(
        (tween) => (tween.vars as { scrambleText: { text: string } }).scrambleText.text,
      ),
    ).toEqual(PROOF_ROWS);
  });

  it('flashes the REC light and lights the panel border at the end', () => {
    const built = mount(phoneSVG());
    const timeline = phoneTimeline(built);
    const panel = tweens(timeline).find((tween) =>
      tween.targets?.().includes(built.querySelector('.panel') as Element),
    );
    const rec = tweens(timeline).find((tween) =>
      tween.targets?.().includes(built.querySelector('.rec circle') as Element),
    );

    expect((rec?.vars as { yoyo?: boolean }).yoyo).toBe(true);
    expect(panel?.startTime()).toBeGreaterThan(rec?.startTime() ?? 99);
  });
});
