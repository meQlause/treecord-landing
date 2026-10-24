import type { InstancedMesh } from 'three';
import { describe, expect, it } from 'vitest';
import { createForest } from '../../../../../src/features/landing/three/forest';

const heightAt = (posX: number, posZ: number) => Math.sin(posX * 0.1) + Math.cos(posZ * 0.1);
const BOUNDS = { minX: -60, maxX: 60, minZ: -100, maxZ: 16 }; // the forest's default area

describe('createForest', () => {
  const forest = createForest({ count: 250, heightAt });
  const treeAt = (index: number) => [
    forest.tops[index * 3],
    forest.tops[index * 3 + 1],
    forest.tops[index * 3 + 2],
  ];
  const trees = Array.from({ length: forest.count }, (_item, index) => treeAt(index));

  it('plants the same forest for the same seed and a different one for another', () => {
    const again = createForest({ count: 250, heightAt });
    const other = createForest({ count: 250, heightAt, seed: 8 });

    expect(Array.from(again.tops)).toEqual(Array.from(forest.tops));
    expect(Array.from(other.tops)).not.toEqual(Array.from(forest.tops));
  });

  it('plants trees, and no more than asked for', () => {
    expect(forest.count).toBeGreaterThan(0);
    expect(forest.count).toBeLessThanOrEqual(250);
  });

  it('keeps one crown-top position (x, y, z) per tree', () => {
    expect(forest.tops).toHaveLength(forest.count * 3);
  });

  it('keeps every tree inside the forest area', () => {
    const inside = trees.every(
      ([posX, , posZ]) =>
        posX >= BOUNDS.minX && posX <= BOUNDS.maxX && posZ >= BOUNDS.minZ && posZ <= BOUNDS.maxZ,
    );

    expect(inside).toBe(true);
  });

  it('puts each crown above the ground it stands on', () => {
    expect(trees.every(([posX, posY, posZ]) => posY > heightAt(posX, posZ))).toBe(true);
  });

  it('draws the forest in four instanced meshes that add up to every tree', () => {
    const meshes = forest.group.children as InstancedMesh[];

    expect(meshes).toHaveLength(4);
    expect(meshes.reduce((sum, mesh) => sum + mesh.count, 0)).toBe(forest.count);
  });

  it('gives each mesh the growth and cluster attributes the shader reads, one per tree', () => {
    for (const mesh of forest.group.children as InstancedMesh[]) {
      expect(mesh.geometry.attributes.aDelay.count).toBe(mesh.count);
      expect(mesh.geometry.attributes.aCluster.count).toBe(mesh.count);
    }
  });

  it('leaves the hero tree its clearing', () => {
    const nearHero = trees.filter(([posX, , posZ]) => Math.hypot(posX, posZ) < 3);

    expect(nearHero).toEqual([]);
  });

  it('disposes without throwing', () => {
    expect(() => createForest({ count: 20, heightAt }).dispose()).not.toThrow();
  });
});
