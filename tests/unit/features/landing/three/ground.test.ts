import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../../three-assets/src/ground.js';
import { createGround } from '../../../../../src/features/landing/three/ground';

const SAMPLES: [number, number][] = [
  [0, 0],
  [3, 2],
  [10, -4],
  [-25, 40],
  [60, -80],
  [-100, 20],
];

describe('createGround', () => {
  const ours = createGround({ segments: 20 });
  const theirs = prototype.createGround({ segments: 20 });

  it.each(SAMPLES)('heightAt(%f, %f) matches the prototype', (posX, posZ) => {
    expect(ours.heightAt(posX, posZ)).toBe(theirs.heightAt(posX, posZ));
  });

  it('is flat where the hero tree stands and rolls further out', () => {
    expect(ours.heightAt(0, 0)).toBe(0);
    expect(Math.abs(ours.heightAt(3, 2))).toBeLessThan(0.05);
    expect(SAMPLES.some(([posX, posZ]) => Math.abs(ours.heightAt(posX, posZ)) > 0.3)).toBe(true);
  });

  it('builds the same low-poly mesh: positions and per-face colours', () => {
    const mine = ours.mesh.geometry.attributes;
    const prior = theirs.mesh.geometry.attributes;

    expect(Array.from(mine.position.array)).toEqual(Array.from(prior.position.array));
    expect(Array.from(mine.color.array)).toEqual(Array.from(prior.color.array));
    expect(ours.mesh.name).toBe('ground');
  });
});
