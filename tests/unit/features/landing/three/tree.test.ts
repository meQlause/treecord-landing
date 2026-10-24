import type { BufferGeometry } from 'three';
import { describe, expect, it } from 'vitest';
import {
  createBroadleafGeometry,
  createConiferGeometry,
  createTreeMaterial,
  treeUniforms,
} from '../../../../../src/features/landing/three/tree';

const positions = (geometry: BufferGeometry) => Array.from(geometry.attributes.position.array);

const MAKERS = [
  ['broadleaf', (seed: number) => createBroadleafGeometry(seed, 0)],
  ['broadleaf (close-up detail)', (seed: number) => createBroadleafGeometry(seed, 1)],
  ['conifer', (seed: number) => createConiferGeometry(seed)],
] as const;

describe.each(MAKERS)('%s geometry', (_name, make) => {
  it('carries every attribute the shader reads, with one entry per vertex', () => {
    const { attributes } = make(1);
    const count = attributes.position.count;

    expect(Object.keys(attributes)).toEqual(
      expect.arrayContaining(['position', 'color', 'aPivot', 'aGrow']),
    );
    expect(attributes.color.count).toBe(count);
    expect(attributes.aPivot.count).toBe(count);
    expect(attributes.aGrow.count).toBe(count);
    expect(attributes.aGrow.itemSize).toBe(4);
  });

  it('is the same tree for the same seed and a different tree for another', () => {
    expect(positions(make(3))).toEqual(positions(make(3)));
    expect(positions(make(3))).not.toEqual(positions(make(4)));
  });

  it('stands on the ground: its base sits at y = 0 and every coordinate is finite', () => {
    const geometry = make(2);

    expect(geometry.boundingBox?.min.y).toBeCloseTo(0, 1);
    expect(positions(geometry).every(Number.isFinite)).toBe(true);
  });

  it('paints every vertex a colour between 0 and 1', () => {
    const colours = Array.from(make(2).attributes.color.array);

    expect(colours.every((value) => value >= 0 && value <= 1)).toBe(true);
  });
});

describe('tree geometry', () => {
  it('a close-up broadleaf has more faces than the forest one', () => {
    expect(createBroadleafGeometry(1, 1).attributes.position.count).toBeGreaterThan(
      createBroadleafGeometry(1, 0).attributes.position.count,
    );
  });

  it('both species grow taller than a trunk', () => {
    expect(createBroadleafGeometry(1, 0).boundingBox?.max.y).toBeGreaterThan(2);
    expect(createConiferGeometry(1).boundingBox?.max.y).toBeGreaterThan(2);
  });
});

describe('tree material', () => {
  it.each([
    ['static', 'STANDARD'], // three's own default define stays untouched
    ['instanced', 'TREE_INSTANCED'],
    ['parts', 'TREE_PARTS'],
  ] as const)('%s mode defines %s', (mode, define) => {
    const material = createTreeMaterial(mode);

    expect(Object.keys(material.defines ?? {})).toEqual([define]);
    expect(material.customProgramCacheKey()).toBe(`treecord-tree-${mode}`);
  });

  it('shares one set of uniform objects so a tween on .value applies to every material', () => {
    expect(Object.keys(treeUniforms).sort()).toEqual(['uCluster', 'uGrow', 'uTime', 'uWind']);
    expect(treeUniforms.uGrow.value).toBeCloseTo(1);
    expect(treeUniforms.uCluster.value).toBeCloseTo(0);
  });
});
