import type { Mesh, Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../../three-assets/src/sky.js';
import { createMountains } from '../../../../../src/features/landing/three/mountains';

const attributes = (group: Object3D, name: string) =>
  group.children.map((mesh) => Array.from((mesh as Mesh).geometry.attributes[name].array));

describe('createMountains', () => {
  const ours = createMountains();
  const theirs = prototype.createMountains();

  it('builds three ridges, drawn behind everything else', () => {
    expect(ours.group.children).toHaveLength(3);
    expect(ours.group.children.every((mesh) => mesh.renderOrder === -1)).toBe(true);
  });

  it('has the same ridge geometry and haze colours as the prototype', () => {
    expect(attributes(ours.group, 'position')).toEqual(attributes(theirs.group, 'position'));
    expect(attributes(ours.group, 'color')).toEqual(attributes(theirs.group, 'color'));
  });
});
