import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../src/generated/prototype/svg-assets/src/objects.js';
import {
  PHONE_SCREEN_VIEWBOX,
  PROOF_ROWS,
  phoneSVG,
  phoneTimeline,
} from '../../../../src/shared/art/phone';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('phone', () => {
  it('draws the same markup as the prototype', () => {
    expect(phoneSVG()).toBe(prototype.phoneSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(phoneSVG());
    const theirs = mount(prototype.phoneSVG());

    expect(describeTimeline(phoneTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.phoneTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = phoneTimeline(mount(phoneSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });

  it('keeps the sample proof values and the screen crop', () => {
    expect(PROOF_ROWS).toEqual(prototype.PROOF_ROWS);
    expect(PHONE_SCREEN_VIEWBOX).toBe(prototype.PHONE_SCREEN_VIEWBOX);
  });

  it('shows whatever proof rows it is given', () => {
    const rows = ['GPS  1,2  ±3 m', 'TIME 2026-01-01 00:00:00'];

    expect(phoneSVG({ rows })).toBe(prototype.phoneSVG({ rows }));
  });
});
