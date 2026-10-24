import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { certificateSVG, certificateTimeline } from '../../../../src/shared/art/certificate';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

describe('certificate', () => {
  const root = mount(certificateSVG());

  it('is a decorative 312 x 320 svg of two halves, a crack, a seal and a price tag', () => {
    expect(root.getAttribute('class')).toBe('tc-certificate');
    expect(root.getAttribute('viewBox')).toBe('0 0 312 320');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.half')).toHaveLength(2);
    expect(root.querySelectorAll('.half.left, .half.right')).toHaveLength(2);
    for (const selector of ['.crack', '.seal', '.pricetag', '.down']) {
      expect(root.querySelectorAll(selector), selector).toHaveLength(1);
    }
  });

  it('starts with the price tag hidden, ready to drop in', () => {
    expect(root.querySelector('.pricetag')?.getAttribute('opacity')).toBe('0');
  });

  it('draws the same way twice', () => {
    expect(certificateSVG()).toBe(certificateSVG());
  });

  it('builds a paused timeline a little over 1 long that cracks, splits and drops the tag', () => {
    const built = mount(certificateSVG());
    const timeline = certificateTimeline(built);
    const moved = new Set(tweens(timeline).flatMap((tween) => tween.targets?.() ?? []));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(timeline.duration()).toBeLessThan(1.2); // the arrow's last bounce runs a little past 1
    for (const selector of ['.crack', '.left', '.right', '.pricetag', '.down']) {
      expect(moved.has(built.querySelector(selector) as Element), selector).toBe(true);
    }
  });

  it('draws the crack first, drops the price tag after it, and bounces the arrow last', () => {
    const built = mount(certificateSVG());
    const timeline = certificateTimeline(built);
    const startOf = (selector: string) =>
      tweens(timeline)
        .find((tween) => tween.targets?.().includes(built.querySelector(selector) as Element))
        ?.startTime() ?? -1;

    expect(startOf('.crack')).toBeLessThan(startOf('.pricetag'));
    expect(startOf('.pricetag')).toBeLessThan(startOf('.down'));
  });
});
