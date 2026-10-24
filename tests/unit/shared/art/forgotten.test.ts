import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../src/generated/prototype/svg-assets/src/scenes.js';
import { forgottenSVG, forgottenTimeline } from '../../../../src/shared/art/forgotten';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('forgotten scene', () => {
  it('draws the same markup as the prototype', () => {
    expect(forgottenSVG()).toBe(prototype.forgottenSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(forgottenSVG());
    const theirs = mount(prototype.forgottenSVG());

    expect(describeTimeline(forgottenTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.forgottenTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = forgottenTimeline(mount(forgottenSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
