import type { Mesh, Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import { createMountains } from '../../../../../src/features/landing/three/mountains';

const attribute = (group: Object3D, name: string) =>
  group.children.map((mesh) => Array.from((mesh as Mesh).geometry.attributes[name].array));

describe('createMountains', () => {
  const mountains = createMountains();
  const positions = attribute(mountains.group, 'position');

  it('builds three ridges, drawn behind everything else', () => {
    expect(mountains.group.children).toHaveLength(3);
    expect(mountains.group.children.every((mesh) => mesh.renderOrder === -1)).toBe(true);
  });

  it('puts each ridge on its own plane, one behind the other', () => {
    const planes = positions.map((ridge) => ridge[2]);

    expect(new Set(planes).size).toBe(3);
    expect(planes).toEqual([...planes].sort((first, second) => first - second));
  });

  it('is made of whole triangles with finite coordinates', () => {
    for (const ridge of positions) {
      expect(ridge.length % 9).toBe(0);
      expect(ridge.every(Number.isFinite)).toBe(true);
    }
  });

  it('colours every vertex between 0 and 1, one colour per vertex', () => {
    attribute(mountains.group, 'color').forEach((colours, ridge) => {
      expect(colours).toHaveLength(positions[ridge].length);
      expect(colours.every((value) => value >= 0 && value <= 1)).toBe(true);
    });
  });

  it('is the same skyline for the same seed and a different one for another', () => {
    const again = attribute(createMountains().group, 'position');
    const other = attribute(createMountains({ seed: 99 }).group, 'position');

    expect(again).toEqual(positions);
    expect(other).not.toEqual(positions);
  });

  it('disposes without throwing', () => {
    expect(() => createMountains().dispose()).not.toThrow();
  });
});
