import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createLeaves } from '../../../../../src/features/landing/three/leaves';

const seeds = (leaves: ReturnType<typeof createLeaves>) =>
  Array.from(leaves.group.geometry.attributes.aSeed.array);

describe('createLeaves', () => {
  it('gives every leaf four random values between 0 and 1', () => {
    const values = seeds(createLeaves({ count: 20 }));

    expect(values).toHaveLength(20 * 4);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('is the same fall for the same seed and a different one for another', () => {
    expect(seeds(createLeaves({ count: 20 }))).toEqual(seeds(createLeaves({ count: 20 })));
    expect(seeds(createLeaves({ count: 20 }))).not.toEqual(
      seeds(createLeaves({ count: 20, seed: 9 })),
    );
  });

  it('draws one instance per leaf', () => {
    const leaves = createLeaves({ count: 20 });

    expect((leaves.group.geometry as unknown as { instanceCount: number }).instanceCount).toBe(20);
  });

  it('follows the camera: the wrap box is centred on the position it is given', () => {
    const leaves = createLeaves({ count: 20 });

    leaves.update(4, new Vector3(1, 2, 3));

    expect(leaves.uniforms.uTime.value).toBeCloseTo(4);
    expect(leaves.uniforms.uCenter.value.toArray()).toEqual([1, 2, 3]);
  });

  it('keeps its centre when no camera position is given', () => {
    const leaves = createLeaves({ count: 20 });
    leaves.update(1, new Vector3(5, 5, 5));

    leaves.update(2);

    expect(leaves.uniforms.uCenter.value.toArray()).toEqual([5, 5, 5]);
    expect(leaves.uniforms.uTime.value).toBeCloseTo(2);
  });

  it('disposes without throwing', () => {
    expect(() => createLeaves({ count: 5 }).dispose()).not.toThrow();
  });
});
