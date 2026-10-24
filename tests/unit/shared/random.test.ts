import { describe, expect, it } from 'vitest';
import { hash3, mulberry32, range, scatter, smoothstep, within } from '../../../src/shared/random';

const draw = (seed: number, count: number) => Array.from({ length: count }, mulberry32(seed));

describe('mulberry32', () => {
  it('gives the same sequence for the same seed, so the same seed grows the same forest', () => {
    expect(draw(7, 50)).toEqual(draw(7, 50));
  });

  it('gives a different sequence for a different seed', () => {
    expect(draw(7, 50)).not.toEqual(draw(8, 50));
  });

  it('stays in [0, 1)', () => {
    const values = draw(99, 2000);

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('is spread evenly enough: the mean is about a half and both halves are used', () => {
    const values = draw(3, 4000);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    expect(mean).toBeCloseTo(0.5, 1);
    expect(values.filter((value) => value < 0.5).length).toBeGreaterThan(1500);
    expect(values.filter((value) => value >= 0.5).length).toBeGreaterThan(1500);
  });
});

describe('range and within', () => {
  it('range maps the generator into [min, max)', () => {
    expect(range(() => 0.5, 10, 20)).toBeCloseTo(15);
    expect(range(() => 0, 10, 20)).toBeCloseTo(10);
  });

  it('within takes the same bounds as an object', () => {
    expect(within(() => 0.25, { min: 0, max: 8 })).toBeCloseTo(2);
  });

  it('every drawn value lies inside its bounds', () => {
    const rng = mulberry32(5);
    const values = Array.from({ length: 500 }, () => within(rng, { min: -3, max: 4 }));

    expect(values.every((value) => value >= -3 && value < 4)).toBe(true);
  });
});

describe('smoothstep', () => {
  it('is 0 below the first edge and 1 above the second', () => {
    expect(smoothstep(4, 16, 0)).toBeCloseTo(0);
    expect(smoothstep(4, 16, 99)).toBeCloseTo(1);
  });

  it('is half way at the middle and never goes down as the input rises', () => {
    const samples = Array.from({ length: 41 }, (_item, step) => smoothstep(4, 16, step * 0.5));

    expect(smoothstep(4, 16, 10)).toBeCloseTo(0.5);
    expect(samples.every((value, index) => index === 0 || value >= samples[index - 1])).toBe(true);
  });
});

describe('hash3', () => {
  it('stays in [0, 1)', () => {
    const values = Array.from({ length: 300 }, (_item, index) =>
      hash3(index * 0.37, index * 1.1, -index),
    );

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('is the same for the same spot, and ignores sub-millimetre differences so shared corners agree', () => {
    expect(hash3(1.2, 3.4, 5.6, 7)).toBeCloseTo(hash3(1.2, 3.4, 5.6, 7));
    expect(hash3(1.2, 3.4, 5.6)).toBeCloseTo(hash3(1.2000001, 3.4, 5.6));
  });

  it('changes with the salt and with the position', () => {
    expect(hash3(1, 2, 3, 0)).not.toBeCloseTo(hash3(1, 2, 3, 1));
    expect(hash3(1, 2, 3)).not.toBeCloseTo(hash3(1.5, 2, 3));
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

  it('places the same points for the same seed', () => {
    expect(scatter({ ...options, rng: mulberry32(7) })).toEqual(
      scatter({ ...options, rng: mulberry32(7) }),
    );
  });

  it('places different points for a different seed', () => {
    expect(scatter({ ...options, rng: mulberry32(7) })).not.toEqual(
      scatter({ ...options, rng: mulberry32(8) }),
    );
  });

  it('keeps the minimum spacing between every pair of points', () => {
    const points = scatter({ ...options, rng: mulberry32(7) });
    const closest = Math.min(
      ...points.flatMap((first, index) =>
        points
          .slice(index + 1)
          .map((second) => Math.hypot(first[0] - second[0], first[1] - second[1])),
      ),
    );

    expect(closest).toBeGreaterThanOrEqual(options.minDist);
  });

  it('stays inside the rectangle and out of the clearing', () => {
    const points = scatter({ ...options, rng: mulberry32(7) });

    expect(
      points.every(([posX, posZ]) => posX >= -30 && posX <= 30 && posZ >= -50 && posZ <= 10),
    ).toBe(true);
    expect(points.every(([posX, posZ]) => Math.hypot(posX, posZ) >= 4)).toBe(true);
  });

  it('stops at the requested count when there is room', () => {
    expect(scatter({ ...options, count: 40, rng: mulberry32(7) })).toHaveLength(40);
  });

  it('stops after its attempts when the rectangle is full, instead of looping', () => {
    const crowded = scatter({ ...options, count: 100000, maxAttempts: 2000, rng: mulberry32(7) });

    expect(crowded.length).toBeGreaterThan(0);
    expect(crowded.length).toBeLessThan(2000);
  });
});
