import { gsap } from 'gsap';
import { describe, expect, it, beforeAll } from 'vitest';
import * as prototype from '../../../../../svg-assets/src/diagrams.js';
import { pipelineSVG, pipelineTimeline } from '../../../../src/shared/art/pipeline';
import { describeTimeline, mount } from '../../../helpers/timelines';

// jsdom has no SVG geometry; both implementations measure the same stand-in path.
beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
    value: () => 1000,
    configurable: true,
  });
  Object.defineProperty(SVGElement.prototype, 'getPointAtLength', {
    value: (length: number) => ({ x: length, y: length / 4 }),
    configurable: true,
  });
});

// The prototype's own module is the oracle: same markup byte for byte, same tweens at the same times.
describe('pipeline', () => {
  it('draws the same markup as the prototype', () => {
    expect(pipelineSVG()).toBe(prototype.pipelineSVG());
  });

  it('builds the same timeline as the prototype', () => {
    const ours = mount(pipelineSVG());
    const theirs = mount(prototype.pipelineSVG());

    expect(describeTimeline(pipelineTimeline(ours), ours)).toEqual(
      describeTimeline(prototype.pipelineTimeline(theirs, gsap), theirs),
    );
  });

  it('is paused and lasts at least 1, ready to be scrubbed', () => {
    const timeline = pipelineTimeline(mount(pipelineSVG()));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
  });
});
