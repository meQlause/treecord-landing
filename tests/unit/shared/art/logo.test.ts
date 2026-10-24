import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../svg-assets/src/objects.js';
import { logoSVG, logoTimeline } from '../../../../src/shared/art/logo';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('logo', () => {
  it('draws the same markup as the prototype', () => {
    expect(logoSVG()).toBe(prototype.logoSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(logoSVG());
    const theirs = mount(prototype.logoSVG());

    expect(describeTimeline(logoTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.logoTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = logoTimeline(mount(logoSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
