import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { BEATS } from '../../../src/landing/beats';
import { ENTER, MOVE, POSES } from '../../../src/landing/camera';
import type { Enter } from '../../../src/landing/types';

const play = (move: Enter) => {
  const out = document.createElement('div');
  const inn = document.createElement('div');
  const timeline = gsap.timeline({ paused: true });
  ENTER[move](timeline, out, inn, 0);
  timeline.progress(1);

  return { out, inn, timeline };
};

describe('POSES', () => {
  it('has a camera pose for every beat', () => {
    expect(Object.keys(POSES).sort()).toEqual(BEATS.map((beat) => beat.id).sort());
  });
});

describe('ENTER', () => {
  it.each(['zoomIn', 'zoomOut', 'panRight', 'panLeft'] as const)(
    '%s settles the incoming beat at scale 1 and in place, visible',
    (move) => {
      const { inn } = play(move);

      expect(gsap.getProperty(inn, 'scale')).toBe(1);
      expect(gsap.getProperty(inn, 'xPercent')).toBe(0);
      expect(gsap.getProperty(inn, 'autoAlpha')).toBe(1);
    },
  );

  it.each(['zoomIn', 'zoomOut'] as const)('%s fades the outgoing beat out', (move) => {
    expect(gsap.getProperty(play(move).out, 'autoAlpha')).toBe(0);
  });

  it('zoomIn grows the outgoing beat and zoomOut shrinks it', () => {
    expect(Number(gsap.getProperty(play('zoomIn').out, 'scale'))).toBeGreaterThan(1);
    expect(Number(gsap.getProperty(play('zoomOut').out, 'scale'))).toBeLessThan(1);
  });

  it('panRight pushes the outgoing beat off to the left, panLeft to the right', () => {
    expect(gsap.getProperty(play('panRight').out, 'xPercent')).toBe(-100);
    expect(gsap.getProperty(play('panLeft').out, 'xPercent')).toBe(100);
  });

  it('a pan takes one camera move of timeline time', () => {
    expect(play('panRight').timeline.duration()).toBe(MOVE);
  });
});
