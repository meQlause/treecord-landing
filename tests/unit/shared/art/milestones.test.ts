import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../svg-assets/src/diagrams.js';
import { milestonesSVG, milestonesTimeline } from '../../../../src/shared/art/milestones';
import { describeTimeline, mount } from '../../../helpers/timelines';

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('milestones', () => {
  it('draws the same markup as the prototype', () => {
    expect(milestonesSVG()).toBe(prototype.milestonesSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(milestonesSVG());
    const theirs = mount(prototype.milestonesSVG());

    expect(describeTimeline(milestonesTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.milestonesTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = milestonesTimeline(mount(milestonesSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
