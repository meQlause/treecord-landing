import type { gsap } from 'gsap';
import { beforeAll, describe, expect, it } from 'vitest';
import { pipelineSVG, pipelineTimeline } from '../../../../src/shared/art/pipeline';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

// jsdom has no SVG geometry: measure a stand-in path that runs left to right
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

describe('pipeline', () => {
  const root = mount(pipelineSVG());
  const nodes = [...root.querySelectorAll('.node')];

  it('is a decorative 1600 x 360 svg with a dotted track, one drawn path and a token to ride it', () => {
    expect(root.getAttribute('class')).toBe('tc-pipeline');
    expect(root.getAttribute('viewBox')).toBe('0 0 1600 360');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('path.flow')).toHaveLength(1);
    expect(root.querySelectorAll('.token')).toHaveLength(1);
  });

  it('has four nodes left to right: video, AI check, donor, chain, each on its own island', () => {
    const icons = nodes.map((node) => node.querySelector('svg.tc-icon')?.getAttribute('class'));
    const columns = nodes.map((node) => Number(node.getAttribute('data-x')));

    expect(icons).toEqual([
      'tc-icon tc-icon--video',
      'tc-icon tc-icon--ai',
      'tc-icon tc-icon--donor',
      'tc-icon tc-icon--chain',
    ]);
    expect(columns).toEqual([...columns].sort((first, second) => first - second));
    expect(root.querySelectorAll('.island')).toHaveLength(4);
    expect(root.querySelectorAll('.node-on')).toHaveLength(4);
  });

  it('keeps three payout coins by the chain node, hidden until the proof arrives', () => {
    expect(root.querySelectorAll('[data-nest=payout]')).toHaveLength(3);
  });

  it('draws the same way twice', () => {
    expect(pipelineSVG()).toBe(pipelineSVG());
  });

  it('builds a paused timeline of at least 1 that draws the path and rides the token along it', () => {
    const built = mount(pipelineSVG());
    const timeline = pipelineTimeline(built);
    const draws = tweens(timeline).filter(
      (tween) => 'drawSVG' in ((tween.vars as { startAt?: object }).startAt ?? tween.vars),
    );
    const rides = tweens(timeline).filter((tween) => 'motionPath' in (tween.vars as object));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(draws.length).toBeGreaterThan(0);
    expect(rides).toHaveLength(1);
    expect(rides[0].targets()).toEqual([built.querySelector('.token')]);
  });

  it('lights each node as the token reaches it, in order, and never in the last moments', () => {
    const built = mount(pipelineSVG());
    const timeline = pipelineTimeline(built);
    const lit = [...built.querySelectorAll('.node-on')].map(
      (glow) =>
        tweens(timeline)
          .find((tween) => tween.targets?.().includes(glow))
          ?.startTime() ?? -1,
    );

    expect(lit).toEqual([...lit].sort((first, second) => first - second));
    expect(Math.max(...lit)).toBeLessThanOrEqual(0.94);
    expect(Math.min(...lit)).toBeGreaterThanOrEqual(0);
  });

  it('pops the three payout coins in near the end', () => {
    const built = mount(pipelineSVG());
    const timeline = pipelineTimeline(built);
    const coins = [...built.querySelectorAll('[data-nest=payout]')];
    const payout = tweens(timeline).find((tween) => tween.targets?.().includes(coins[0]));

    expect(payout?.targets()).toHaveLength(3);
    expect(payout?.startTime()).toBeGreaterThan(0.9);
  });
});
