import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../svg-assets/src/objects.js';
import { serialSVG, serialTimeline } from '../../../../src/shared/art/serial';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('serial', () => {
  it('draws the same markup as the prototype', () => {
    expect(serialSVG()).toBe(prototype.serialSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(serialSVG());
    const theirs = mount(prototype.serialSVG());

    expect(describeTimeline(serialTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.serialTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = serialTimeline(mount(serialSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });

  it('shows whatever meta line and serial it is given, scrambled until the timeline reveals it', () => {
    const options = { meta: 'SRN TEST · 1 tCO₂e', serial: 'ABC-2026-000007' };

    expect(serialSVG(options)).toBe(prototype.serialSVG(options));
    expect(serialSVG(options)).toContain('data-text="ABC-2026-000007"');
  });
});
