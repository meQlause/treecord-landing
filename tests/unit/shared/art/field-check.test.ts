import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../svg-assets/src/scenes.js';
import { fieldCheckSVG, fieldCheckTimeline } from '../../../../src/shared/art/field-check';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('field check', () => {
  it('draws the same markup as the prototype', () => {
    expect(fieldCheckSVG()).toBe(prototype.fieldCheckSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(fieldCheckSVG());
    const theirs = mount(prototype.fieldCheckSVG());

    expect(describeTimeline(fieldCheckTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.fieldCheckTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = fieldCheckTimeline(mount(fieldCheckSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
