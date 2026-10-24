import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { forgottenSVG, forgottenTimeline } from '../../../../src/shared/art/forgotten';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

describe('forgotten scene', () => {
  const root = mount(forgottenSVG());

  it('is a decorative 270 x 320 polaroid of a seedling, clipped to its photo', () => {
    expect(root.getAttribute('class')).toBe('tc-forgotten');
    expect(root.getAttribute('viewBox')).toBe('0 0 270 320');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('clipPath#tc-polaroid')).not.toBeNull();
    expect(root.querySelector('[clip-path="url(#tc-polaroid)"]')).not.toBeNull();
  });

  it('has every part the timeline wilts: card, flash, sepia wash, stem, two leaves and the mound', () => {
    for (const selector of ['.card', '.flash', '.sepia', '.stem', '.leafL', '.leafR', '.mound']) {
      expect(root.querySelectorAll(selector), selector).toHaveLength(1);
    }
    expect(root.querySelector('.flash')?.getAttribute('opacity')).toBe('0');
    expect(root.querySelector('.sepia')?.getAttribute('opacity')).toBe('0');
  });

  it('says where each leaf pivots, and says "DAY 1" on the card', () => {
    expect(root.querySelector('.leafL')?.getAttribute('data-pivot')).toBe('130 152');
    expect(root.querySelector('.leafR')?.getAttribute('data-pivot')).toBe('130 152');
    expect(root.textContent).toContain('DAY 1');
  });

  it('draws the same way twice', () => {
    expect(forgottenSVG()).toBe(forgottenSVG());
  });

  it('builds a paused timeline of at least 1 that flashes, wilts, dries and tosses the card', () => {
    const built = mount(forgottenSVG());
    const timeline = forgottenTimeline(built);
    const moved = new Set(tweens(timeline).flatMap((tween) => tween.targets?.() ?? []));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    for (const selector of ['.card', '.flash', '.sepia', '.stem', '.leafL', '.leafR']) {
      expect(moved.has(built.querySelector(selector) as Element), selector).toBe(true);
    }
  });

  it('dries each polygon from its own colour: the fill is a per-element function', () => {
    const drying = tweens(forgottenTimeline(mount(forgottenSVG()))).filter(
      (tween) => typeof (tween.vars as { fill?: unknown }).fill === 'function',
    );

    expect(drying).toHaveLength(1);
    expect(drying[0].targets().length).toBeGreaterThan(5); // both leaves and the stem
  });

  it('fires the flash before the leaves droop, and tosses the card last', () => {
    const built = mount(forgottenSVG());
    const startOf = (selector: string) =>
      Math.min(
        ...tweens(forgottenTimeline(built))
          .filter((tween) => tween.targets?.().includes(built.querySelector(selector) as Element))
          .map((tween) => tween.startTime()),
      );
    const cardTweens = tweens(forgottenTimeline(built))
      .filter((tween) => tween.targets?.().includes(built.querySelector('.card') as Element))
      .map((tween) => tween.startTime());

    expect(startOf('.flash')).toBeLessThan(startOf('.leafL'));
    expect(Math.max(...cardTweens)).toBeGreaterThan(startOf('.sepia'));
  });
});
