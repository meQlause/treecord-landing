import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { blindFundingSVG, blindFundingTimeline } from '../../../../src/shared/art/blind-funding';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];
const touched = (timeline: gsap.core.Timeline) =>
  tweens(timeline).flatMap((tween) => tween.targets?.() ?? []);

describe('blind funding', () => {
  const root = mount(blindFundingSVG());

  it('is a decorative 400 x 220 svg with the parts its timeline looks up', () => {
    expect(root.getAttribute('class')).toBe('tc-blind');
    expect(root.getAttribute('viewBox')).toBe('0 0 400 220');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    for (const selector of ['.donor', '.arc', '.coins', '.cloud']) {
      expect(root.querySelectorAll(selector), selector).toHaveLength(1);
    }
  });

  it('has three coins waiting at the start of the arc and three question marks hidden in the fog', () => {
    expect(root.querySelectorAll('[data-nest=coin]')).toHaveLength(3);
    expect(root.querySelectorAll('.q')).toHaveLength(3);
    expect([...root.querySelectorAll('.q')].every((mark) => mark.textContent === '?')).toBe(true);
  });

  it('draws the same way twice', () => {
    expect(blindFundingSVG()).toBe(blindFundingSVG());
  });

  it('builds a paused timeline of at least 1 that moves the donor, cloud, arc, every coin and every mark', () => {
    const timeline = blindFundingTimeline(mount(blindFundingSVG()));
    const built = mount(blindFundingSVG());
    const moved = new Set(touched(blindFundingTimeline(built)));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    for (const selector of ['.donor', '.cloud', '.arc']) {
      expect(moved.has(built.querySelector(selector) as Element), selector).toBe(true);
    }
    for (const part of [...built.querySelectorAll('[data-nest=coin], .q')]) {
      expect(moved.has(part)).toBe(true);
    }
  });

  it('sends each coin along the arc with a motion path, one after the other', () => {
    const timeline = blindFundingTimeline(mount(blindFundingSVG()));
    const rides = tweens(timeline).filter((tween) => 'motionPath' in (tween.vars as object));
    const starts = rides.map((tween) => tween.startTime());

    expect(rides).toHaveLength(3);
    expect(starts).toEqual([...starts].sort((first, second) => first - second));
    expect(new Set(starts).size).toBe(3);
  });
});
