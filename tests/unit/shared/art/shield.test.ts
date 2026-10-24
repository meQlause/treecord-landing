import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../src/generated/prototype/svg-assets/src/objects.js';
import { shieldSVG, shieldTimeline } from '../../../../src/shared/art/shield';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('shield', () => {
  it('draws the same markup as the prototype', () => {
    expect(shieldSVG()).toBe(prototype.shieldSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(shieldSVG());
    const theirs = mount(prototype.shieldSVG());

    expect(describeTimeline(shieldTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.shieldTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = shieldTimeline(mount(shieldSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
