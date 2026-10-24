import type { InstancedMesh } from 'three';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../../three-assets/src/forest.js';
import { createForest } from '../../../../../src/features/landing/three/forest';

const heightAt = (posX: number, posZ: number) => Math.sin(posX * 0.1) + Math.cos(posZ * 0.1);

describe('createForest', () => {
  const ours = createForest({ count: 250, heightAt });
  const theirs = prototype.createForest({ count: 250, heightAt } as never);

  it('plants the same trees as the prototype: count and crown tops', () => {
    expect(ours.count).toBe(theirs.count);
    expect(Array.from(ours.tops)).toEqual(Array.from(theirs.tops));
  });

  it('keeps one crown-top position (x, y, z) per tree', () => {
    expect(ours.tops).toHaveLength(ours.count * 3);
  });

  it('draws the forest in four instanced meshes that add up to every tree', () => {
    const meshes = ours.group.children as InstancedMesh[];

    expect(meshes).toHaveLength(4);
    expect(meshes.reduce((sum, mesh) => sum + mesh.count, 0)).toBe(ours.count);
  });

  it('leaves the hero tree its clearing', () => {
    const nearHero = Array.from({ length: ours.count }, (_item, index) =>
      Math.hypot(ours.tops[index * 3], ours.tops[index * 3 + 2]),
    ).filter((distance) => distance < 3);

    expect(nearHero).toEqual([]);
  });

  it('disposes without throwing', () => {
    expect(() => ours.dispose()).not.toThrow();
  });
});
