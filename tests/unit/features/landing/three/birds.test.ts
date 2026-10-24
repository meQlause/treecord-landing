import { describe, expect, it } from 'vitest';
import { createBirds } from '../../../../../src/features/landing/three/birds';

const matrices = (birds: ReturnType<typeof createBirds>) =>
  Array.from(birds.group.instanceMatrix.array);

describe('createBirds', () => {
  it('draws one instance per bird', () => {
    const birds = createBirds({ count: 5 });

    expect(birds.group.count).toBe(5);
    expect(birds.group.name).toBe('birds');
  });

  it('flies: the flock is somewhere else a while later, and every position stays finite', () => {
    const birds = createBirds({ count: 8 });

    birds.update(10);
    const earlier = matrices(birds);
    birds.update(60);

    expect(matrices(birds)).not.toEqual(earlier);
    expect(matrices(birds).every(Number.isFinite)).toBe(true);
  });

  it('is the same flock at the same moment for the same seed', () => {
    const flockAt = (seed: number) => {
      const birds = createBirds({ count: 8, seed });
      birds.update(30);

      return matrices(birds);
    };

    expect(flockAt(41)).toEqual(flockAt(41));
    expect(flockAt(41)).not.toEqual(flockAt(42));
  });

  it('flies in a loop: the leader is back over the same spot after one full circuit', () => {
    const lap = (2 * Math.PI) / 0.045; // seconds for one circuit of the loop
    const birds = createBirds({ count: 4 });
    const ground = (): number[] => {
      const matrix = matrices(birds);

      return [matrix[12], matrix[14]]; // x and z of the leader; the height bobs on its own rhythm
    };

    birds.update(5);
    const start = ground();
    birds.update(5 + lap);

    ground().forEach((value, index) => expect(value).toBeCloseTo(start[index], 1));
  });

  it('disposes without throwing', () => {
    expect(() => createBirds({ count: 3 }).dispose()).not.toThrow();
  });
});
