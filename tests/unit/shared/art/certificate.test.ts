import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../svg-assets/src/objects.js';
import { certificateSVG, certificateTimeline } from '../../../../src/shared/art/certificate';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('certificate', () => {
  it('draws the same markup as the prototype', () => {
    expect(certificateSVG()).toBe(prototype.certificateSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(certificateSVG());
    const theirs = mount(prototype.certificateSVG());

    expect(describeTimeline(certificateTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.certificateTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = certificateTimeline(mount(certificateSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
