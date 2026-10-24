import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { place } from '../../../../src/features/landing/helpers';

describe('place', () => {
  it('adds the asset timeline unpaused, stretched to the length, at the start time', () => {
    const outer = gsap.timeline({ paused: true });
    const asset = gsap.timeline({ paused: true }).to({}, { duration: 1 });

    place(outer, asset, 2, 4);

    expect(asset.paused()).toBe(false);
    expect(asset.timeScale()).toBe(1 / 4); // GSAP stretches a timeline by scaling its time
    expect(asset.startTime()).toBe(2);
    expect(outer.duration()).toBe(6);
  });

  it('defaults to the start of the timeline and a length of one', () => {
    const outer = gsap.timeline({ paused: true });
    const asset = gsap.timeline({ paused: true }).to({}, { duration: 3 });

    place(outer, asset);

    expect(asset.startTime()).toBe(0);
    expect(asset.timeScale()).toBe(3);
  });
});
