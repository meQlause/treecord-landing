import type { InstancedMesh } from 'three';
import { describe, expect, it } from 'vitest';
import { createClouds } from '../../../../../src/features/landing/three/clouds';

const MATRIX_SIZE = 16;
const X_AT = 12; // where an instance matrix keeps its x translation

/** Every cloud's x, across all the instanced meshes. */
const positionsX = (group: { children: unknown[] }) =>
  (group.children as InstancedMesh[]).flatMap((mesh) =>
    Array.from(
      { length: mesh.count },
      (_item, index) => mesh.instanceMatrix.array[index * MATRIX_SIZE + X_AT],
    ),
  );

describe('createClouds', () => {
  it('draws clouds in instanced meshes, at least as many as asked for', () => {
    const clouds = createClouds({ count: 12 });

    expect(clouds.group.name).toBe('clouds');
    expect(clouds.group.children.length).toBeGreaterThan(0);
    expect(positionsX(clouds.group).length).toBeGreaterThanOrEqual(12);
  });

  it('drifts: the clouds are somewhere else a while later', () => {
    const clouds = createClouds({ count: 12 });

    clouds.update(0);
    const before = positionsX(clouds.group);
    clouds.update(20);

    expect(positionsX(clouds.group)).not.toEqual(before);
  });

  it('is the same sky for the same seed and a different one for another', () => {
    const skyAt = (seed: number) => {
      const clouds = createClouds({ count: 12, seed });
      clouds.update(5);

      return positionsX(clouds.group);
    };

    expect(skyAt(21)).toEqual(skyAt(21));
    expect(skyAt(21)).not.toEqual(skyAt(22));
  });

  it('wraps around the band instead of drifting away', () => {
    const clouds = createClouds({ count: 6, minX: -10, maxX: 10 });

    clouds.update(1e6);

    expect(positionsX(clouds.group).every((posX) => posX >= -10 && posX <= 10)).toBe(true);
  });

  it('hides the group when the beat thins the clouds to nothing', () => {
    const clouds = createClouds({ count: 6 });

    clouds.opacity = 0;
    expect(clouds.group.visible).toBe(false);

    clouds.opacity = 0.3;
    expect(clouds.group.visible).toBe(true);
    expect(clouds.opacity).toBeCloseTo(0.3);
  });

  it('disposes without throwing', () => {
    expect(() => createClouds({ count: 3 }).dispose()).not.toThrow();
  });
});
