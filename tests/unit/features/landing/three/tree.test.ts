import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../src/generated/prototype/three-assets/src/tree.js';
import {
  createBroadleafGeometry,
  createConiferGeometry,
  createTreeMaterial,
  treeUniforms,
} from '../../../../../src/features/landing/three/tree';

interface Geometry {
  attributes: Record<string, { array: ArrayLike<number> }>;
}

const same = (ours: Geometry, theirs: Geometry) => {
  expect(Object.keys(ours.attributes).sort()).toEqual(Object.keys(theirs.attributes).sort());
  for (const name of Object.keys(ours.attributes)) {
    expect(Array.from(ours.attributes[name].array)).toEqual(
      Array.from(theirs.attributes[name].array),
    );
  }
};

describe('tree geometry', () => {
  it.each([
    [1, 0],
    [1, 1],
    [8, 0],
  ])('broadleaf seed %i detail %i matches the prototype vertex for vertex', (seed, detail) => {
    same(createBroadleafGeometry(seed, detail), prototype.createBroadleafGeometry(seed, detail));
  });

  it.each([1, 4, 10])('conifer seed %i matches the prototype vertex for vertex', (seed) => {
    same(createConiferGeometry(seed), prototype.createConiferGeometry(seed));
  });

  it('carries the attributes the shader reads, with the base at y = 0', () => {
    const geometry = createBroadleafGeometry(1, 0);

    expect(Object.keys(geometry.attributes)).toEqual(
      expect.arrayContaining(['position', 'color', 'aPivot', 'aGrow']),
    );
    expect(geometry.boundingBox?.min.y).toBeCloseTo(0, 1);
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
    expect(treeUniforms).toEqual(prototype.treeUniforms);
  });
});
