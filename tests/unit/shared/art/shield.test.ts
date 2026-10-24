import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { shieldSVG, shieldTimeline } from '../../../../src/shared/art/shield';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

describe('shield', () => {
  const root = mount(shieldSVG());

  it('is a decorative 120 x 140 shield with a check mark to draw', () => {
    expect(root.getAttribute('class')).toBe('tc-shield');
    expect(root.getAttribute('viewBox')).toBe('0 0 120 140');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.shield')).toHaveLength(1);
    expect(root.querySelectorAll('.shield .check')).toHaveLength(1);
    expect(root.querySelectorAll('polygon')).toHaveLength(6); // a six-point fan
  });

  it('draws the same way twice', () => {
    expect(shieldSVG()).toBe(shieldSVG());
  });

  it('builds a paused timeline of at least 1 that pops the shield in, then draws the check', () => {
    const built = mount(shieldSVG());
    const timeline = shieldTimeline(built);
    const startOf = (selector: string) =>
      tweens(timeline)
        .find((tween) => tween.targets?.().includes(built.querySelector(selector) as Element))
        ?.startTime() ?? -1;

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(startOf('.shield')).toBe(0);
    expect(startOf('.check')).toBeGreaterThan(startOf('.shield'));
  });
});
