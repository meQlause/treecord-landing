import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { milestonesSVG, milestonesTimeline } from '../../../../src/shared/art/milestones';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

const MONTHS = ['0', '3', '6', '12', '24', '36 mo'];

describe('milestones', () => {
  const root = mount(milestonesSVG());
  const marks = [...root.querySelectorAll('.milestone')];

  it('is a decorative 1200 x 260 svg with one progress line and its track', () => {
    expect(root.getAttribute('class')).toBe('tc-milestones');
    expect(root.getAttribute('viewBox')).toBe('0 0 1200 260');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.progress')).toHaveLength(1);
  });

  it('marks the six payouts at months 0, 3, 6, 12, 24 and 36, labelled, on a true time scale', () => {
    const labels = marks.map((mark) => mark.querySelector('text')?.textContent);
    const ats = marks.map((mark) => Number(mark.getAttribute('data-at')));
    const columns = marks.map((mark) => Number(mark.getAttribute('data-x')));

    expect(labels).toEqual(MONTHS);
    expect(ats[0]).toBe(0);
    expect(ats[5]).toBe(1);
    expect(ats[3]).toBeCloseTo(12 / 36);
    expect(columns).toEqual([...columns].sort((first, second) => first - second));
    expect(columns[5] - columns[4]).toBeCloseTo(columns[4] - columns[3]); // 24 -> 36 looks as long as 12 -> 24
  });

  it('gives each milestone a lit dot and a coin, the 40% coin the biggest', () => {
    const sizes = marks.map((mark) =>
      Number(mark.querySelector('[data-nest=coin] svg')?.getAttribute('width')),
    );

    expect(root.querySelectorAll('.dot-on')).toHaveLength(6);
    expect(root.querySelectorAll('[data-nest=coin]')).toHaveLength(6);
    expect(Math.max(...sizes)).toBe(sizes[5]);
    expect(sizes[5]).toBeCloseTo(sizes[0] * 2); // coin area tracks the share: 40% is four times 10%
  });

  it('draws the same way twice', () => {
    expect(milestonesSVG()).toBe(milestonesSVG());
  });

  it('builds a paused timeline of about 1 that draws the line and lights each milestone as it is reached', () => {
    const built = mount(milestonesSVG());
    const timeline = milestonesTimeline(built);
    const dots = [...built.querySelectorAll('.dot-on')];
    const lights = dots.map(
      (dot) =>
        tweens(timeline)
          .find((tween) => tween.targets?.().includes(dot))
          ?.startTime() ?? -1,
    );

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(tweens(timeline)).toHaveLength(13); // the line, then a dot and a coin for each of six milestones
    expect(lights).toEqual([...lights].sort((first, second) => first - second));
    expect(lights[0]).toBe(0);
  });
});
