import type { InstancedMesh } from 'three';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../src/generated/prototype/three-assets/src/sky.js';
import { createClouds } from '../../../../../src/features/landing/three/clouds';

const matrices = (group: { children: unknown[] }) =>
  (group.children as InstancedMesh[]).map((mesh) => Array.from(mesh.instanceMatrix.array));

describe('createClouds', () => {
  it('drifts the same way as the prototype at a given time', () => {
    const ours = createClouds({ count: 12 });
    const theirs = prototype.createClouds({ count: 12 });
    ours.update(37.5);
    theirs.update(37.5);

    expect(matrices(ours.group)).toEqual(matrices(theirs.group));
  });

  it('wraps around the band instead of drifting away', () => {
    const clouds = createClouds({ count: 6, minX: -10, maxX: 10 });
    clouds.update(1e6);
    const reach = (clouds.group.children as InstancedMesh[]).flatMap((mesh) =>
      Array.from(
        { length: mesh.count },
        (_item, index) => mesh.instanceMatrix.array[index * 16 + 12],
      ),
    );

    expect(reach.every((posX) => posX >= -10 && posX <= 10)).toBe(true);
  });

  it('hides the group when the beat thins the clouds to nothing', () => {
    const clouds = createClouds({ count: 6 });

    clouds.opacity = 0;
    expect(clouds.group.visible).toBe(false);

    clouds.opacity = 0.3;
    expect(clouds.group.visible).toBe(true);
    expect(clouds.opacity).toBeCloseTo(0.3);
  });
});
