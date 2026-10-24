import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../../three-assets/src/random.js';
import {
  hash3,
  mulberry32,
  range,
  scatter,
  smoothstep,
} from '../../../../../src/features/landing/three/random';

// The prototype's own module is the oracle: the same seed must give the same forest.
describe('mulberry32', () => {
  it.each([1, 3, 7, 11, 51])('seed %i gives the prototype sequence', (seed) => {
    const ours = mulberry32(seed);
    const theirs = prototype.mulberry32(seed);

    expect(Array.from({ length: 20 }, ours)).toEqual(Array.from({ length: 20 }, theirs));
  });

  it('stays in [0, 1)', () => {
    const rng = mulberry32(99);
    const values = Array.from({ length: 500 }, rng);

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

describe('range, smoothstep, hash3', () => {
  it('range maps the generator into [min, max)', () => {
    expect(range(() => 0.5, 10, 20)).toBe(15);
  });

  it('smoothstep clamps below, above and eases between', () => {
    expect(smoothstep(4, 16, 0)).toBe(0);
    expect(smoothstep(4, 16, 99)).toBe(1);
    expect(smoothstep(4, 16, 10)).toBe(prototype.smoothstep(4, 16, 10));
  });

  it('hash3 matches the prototype and ignores sub-millimetre differences', () => {
    expect(hash3(1.2, 3.4, 5.6, 7)).toBe(prototype.hash3(1.2, 3.4, 5.6, 7));
    expect(hash3(1.2, 3.4, 5.6)).toBe(hash3(1.2000001, 3.4, 5.6));
  });
});

describe('scatter', () => {
  const options = {
    count: 300,
    minX: -30,
    maxX: 30,
    minZ: -50,
    maxZ: 10,
    minDist: 1.3,
    clearings: [{ x: 0, z: 0, r: 4 }],
  };

  it('places the same points as the prototype', () => {
    const ours = scatter({ ...options, rng: mulberry32(7) });
    const theirs = prototype.scatter({ ...options, rng: prototype.mulberry32(7) } as never);

    expect(ours).toEqual(theirs);
  });

  it('keeps the minimum spacing and the clearing', () => {
    const points = scatter({ ...options, rng: mulberry32(7) });
    const closest = Math.min(
      ...points.flatMap((first, index) =>
        points
          .slice(index + 1)
          .map((second) => Math.hypot(first[0] - second[0], first[1] - second[1])),
      ),
    );

    expect(closest).toBeGreaterThanOrEqual(options.minDist);
    expect(points.every(([posX, posZ]) => Math.hypot(posX, posZ) >= 4)).toBe(true);
  });
});
