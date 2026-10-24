import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../svg-assets/src/objects.js';
import { blindFundingSVG, blindFundingTimeline } from '../../../../src/shared/art/blind-funding';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('blind funding', () => {
  it('draws the same markup as the prototype', () => {
    expect(blindFundingSVG()).toBe(prototype.blindFundingSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(blindFundingSVG());
    const theirs = mount(prototype.blindFundingSVG());

    expect(describeTimeline(blindFundingTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.blindFundingTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = blindFundingTimeline(mount(blindFundingSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
