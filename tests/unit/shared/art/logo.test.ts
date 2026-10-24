import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { logoSVG, logoTimeline } from '../../../../src/shared/art/logo';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

describe('logo', () => {
  const root = mount(logoSVG());

  it('is a decorative 64 x 64 svg: four crown facets, a two-facet trunk and a verified badge', () => {
    expect(root.getAttribute('class')).toBe('tc-logo');
    expect(root.getAttribute('viewBox')).toBe('0 0 64 64');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('polygon.facet')).toHaveLength(4);
    expect(root.querySelectorAll('.trunk polygon')).toHaveLength(2);
    expect(root.querySelectorAll('.badge')).toHaveLength(1);
    expect(root.querySelectorAll('.badge .check')).toHaveLength(1);
  });

  it('draws the same way twice', () => {
    expect(logoSVG()).toBe(logoSVG());
  });

  it('builds a paused timeline of at least 1 that assembles the crown, trunk and badge in that order', () => {
    const built = mount(logoSVG());
    const timeline = logoTimeline(built);
    const startOf = (selector: string) =>
      tweens(timeline)
        .find((tween) => tween.targets?.().includes(built.querySelector(selector) as Element))
        ?.startTime() ?? -1;

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(startOf('.facet')).toBeLessThan(startOf('.trunk'));
    expect(startOf('.trunk')).toBeLessThan(startOf('.badge'));
    expect(startOf('.badge')).toBeLessThan(startOf('.badge .check'));
  });

  it('scatters each facet in from its own random place: the offsets are functions', () => {
    const scatter = tweens(logoTimeline(mount(logoSVG())))[0].vars as Record<string, unknown>;

    expect(scatter.x).toBeInstanceOf(Function);
    expect(scatter.y).toBeInstanceOf(Function);
    expect(scatter.rotation).toBeInstanceOf(Function);
    expect(tweens(logoTimeline(mount(logoSVG())))[0].targets()).toHaveLength(4);
  });

  it('scatters the same way every time it is built: the offsets are seeded', () => {
    const first = tweens(logoTimeline(mount(logoSVG())))[0].vars as { x: () => number };
    const second = tweens(logoTimeline(mount(logoSVG())))[0].vars as { x: () => number };

    expect([first.x(), first.x()]).toEqual([second.x(), second.x()]);
  });
});
