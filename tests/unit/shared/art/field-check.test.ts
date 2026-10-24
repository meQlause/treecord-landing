import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { fieldCheckSVG, fieldCheckTimeline } from '../../../../src/shared/art/field-check';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

describe('field check', () => {
  const root = mount(fieldCheckSVG());

  it('is a decorative 340 x 300 svg: a forest tile, a satellite with its beam, a pin and GPS rings', () => {
    expect(root.getAttribute('class')).toBe('tc-field');
    expect(root.getAttribute('viewBox')).toBe('0 0 340 300');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    for (const selector of ['.tile', '.sat', '.beam', '.pin']) {
      expect(root.querySelectorAll(selector), selector).toHaveLength(1);
    }
  });

  it('plants six trees on the tile and locks three GPS rings, each narrower stroke fainter than the last', () => {
    const widths = [...root.querySelectorAll('.ring')].map((ring) =>
      Number(ring.getAttribute('stroke-width')),
    );
    const opacities = [...root.querySelectorAll('.ring')].map((ring) =>
      Number(ring.getAttribute('stroke-opacity')),
    );

    expect(root.querySelectorAll('.tile .tree')).toHaveLength(6);
    expect(widths).toHaveLength(3);
    expect(widths).toEqual([...widths].sort((first, second) => second - first));
    expect(opacities).toEqual([...opacities].sort((first, second) => second - first));
  });

  it('draws the same way twice: the tree heights are seeded', () => {
    expect(fieldCheckSVG()).toBe(fieldCheckSVG());
  });

  it('builds a paused timeline of at least 1 that moves the tile, every tree, the satellite, beam, pin and rings', () => {
    const built = mount(fieldCheckSVG());
    const timeline = fieldCheckTimeline(built);
    const moved = new Set(tweens(timeline).flatMap((tween) => tween.targets?.() ?? []));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    for (const part of [...built.querySelectorAll('.tile, .tree, .sat, .beam, .pin, .ring')]) {
      expect(moved.has(part)).toBe(true);
    }
  });

  it('drops the pin and draws the rings after the satellite has arrived', () => {
    const built = mount(fieldCheckSVG());
    const startOf = (selector: string) =>
      tweens(fieldCheckTimeline(built))
        .find((tween) => tween.targets?.().includes(built.querySelector(selector) as Element))
        ?.startTime() ?? -1;

    expect(startOf('.sat')).toBeLessThan(startOf('.pin'));
    expect(startOf('.pin')).toBeLessThan(startOf('.ring'));
  });
});
