import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../../three-assets/src/sky.js';
import { createLeaves } from '../../../../../src/features/landing/three/leaves';

describe('createLeaves', () => {
  it('seeds the same leaves as the prototype', () => {
    const ours = createLeaves({ count: 20 });
    const theirs = prototype.createLeaves({ count: 20 });
    const seeds = (leaves: {
      group: { geometry: { attributes: Record<string, { array: ArrayLike<number> }> } };
    }) => Array.from(leaves.group.geometry.attributes.aSeed.array);

    expect(seeds(ours)).toEqual(seeds(theirs as typeof ours));
  });

  it('follows the camera: the wrap box is centred on the position it is given', () => {
    const leaves = createLeaves({ count: 20 });

    leaves.update(4, new Vector3(1, 2, 3));

    expect(leaves.uniforms.uTime.value).toBe(4);
    expect(leaves.uniforms.uCenter.value.toArray()).toEqual([1, 2, 3]);
  });

  it('keeps its centre when no camera position is given', () => {
    const leaves = createLeaves({ count: 20 });
    leaves.update(1, new Vector3(5, 5, 5));

    leaves.update(2);

    expect(leaves.uniforms.uCenter.value.toArray()).toEqual([5, 5, 5]);
  });
});
