import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../src/generated/prototype/svg-assets/src/icons.js';
import { ICONS, iconSVG, iconTimeline, type IconName } from '../../../../src/shared/art/icons';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
const NAMES = Object.keys(prototype.ICONS) as IconName[];

describe('icons', () => {
  it('has the same four pipeline icons and five role icons as the prototype', () => {
    expect(Object.keys(ICONS)).toEqual(NAMES);
    expect(NAMES).toHaveLength(9);
  });

  it.each(NAMES)('%s is drawn like the prototype', (name) => {
    expect(ICONS[name]()).toBe(prototype.ICONS[name]());
    expect(iconSVG(name)).toBe(prototype.iconSVG(name));
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(iconSVG('planter'));
    const theirs = mount(prototype.iconSVG('planter'));

    expect(describeTimeline(iconTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.iconTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = iconTimeline(mount(iconSVG('video')));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
