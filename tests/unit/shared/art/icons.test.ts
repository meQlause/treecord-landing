import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { ICONS, iconSVG, iconTimeline, type IconName } from '../../../../src/shared/art/icons';
import { mount } from '../../../helpers/timelines';

const NAMES = Object.keys(ICONS) as IconName[];
const PIPELINE = ['video', 'ai', 'donor', 'chain'];
const ROLES = ['donorRole', 'planter', 'developer', 'verifier', 'buyer'];

describe('icons', () => {
  it('are the four pipeline nodes and the five roles', () => {
    expect(NAMES).toEqual([...PIPELINE, ...ROLES]);
  });

  it.each(NAMES)('%s is a decorative 64 x 64 svg with one .icon group of facets', (name) => {
    const root = mount(iconSVG(name));

    expect(root.getAttribute('viewBox')).toBe('0 0 64 64');
    expect(root.getAttribute('class')).toBe(`tc-icon tc-icon--${name}`);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.icon')).toHaveLength(1);
    expect(root.querySelectorAll('polygon').length).toBeGreaterThan(2);
  });

  it.each(NAMES)('%s draws the same way twice and differs from the others', (name) => {
    expect(iconSVG(name)).toBe(iconSVG(name));
    expect(NAMES.filter((other) => iconSVG(other) === iconSVG(name))).toEqual([name]);
  });

  it('the AI icon has its scan line, the only element the timeline never needs', () => {
    expect(mount(iconSVG('ai')).querySelector('.scan')).not.toBeNull();
  });

  it('builds a paused timeline of at least 1 that pops the icon in and settles its facets', () => {
    const root = mount(iconSVG('planter'));
    const timeline = iconTimeline(root);
    const children = timeline.getChildren(true, true, true);

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(children).toHaveLength(3); // the pop, the facets, and the marker that pads it to 1
  });

  it('settles only the polygons that are direct children of .icon', () => {
    const root = mount(iconSVG('developer'));
    const facets = new Set(root.querySelectorAll('.icon > polygon'));
    const timeline = iconTimeline(root);
    const moved = timeline
      .getChildren(true, true, true)
      .flatMap((child) => (child as gsap.core.Tween).targets?.() ?? []);

    expect([...facets].every((facet) => moved.includes(facet))).toBe(true);
  });
});
