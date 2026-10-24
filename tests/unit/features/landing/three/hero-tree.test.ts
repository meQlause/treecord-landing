import type { Mesh } from 'three';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../../three-assets/src/hero-tree.js';
import { createHeroTree } from '../../../../../src/features/landing/three/hero-tree';

describe('createHeroTree', () => {
  it('builds the same tree mesh as the prototype', () => {
    const ours = createHeroTree().group.children[0] as Mesh;
    const theirs = prototype.createHeroTree().group.children[0] as Mesh;

    expect(Array.from(ours.geometry.attributes.position.array)).toEqual(
      Array.from(theirs.geometry.attributes.position.array),
    );
    expect(Array.from(ours.geometry.attributes.aGrow.array)).toEqual(
      Array.from(theirs.geometry.attributes.aGrow.array),
    );
  });

  it('holds tree, mound and two halo rings in one named group', () => {
    const hero = createHeroTree();

    expect(hero.group.name).toBe('hero-tree');
    expect(hero.group.children).toHaveLength(4);
  });

  it('growth and focus read back what was set; growth drives the shader uniform', () => {
    const hero = createHeroTree();

    hero.growth = 0.4;
    hero.focus = 0.7;

    expect(hero.growth).toBeCloseTo(0.4);
    expect(hero.focus).toBeCloseTo(0.7);
    expect(hero.uniforms.uHeroGrow.value).toBeCloseTo(0.4);
  });

  it('shows the halo only while the hero is in focus, and pulses outward', () => {
    const hero = createHeroTree();
    const [, , ring, pulse] = hero.group.children;

    hero.focus = 0;
    hero.update(1);
    expect(ring.visible).toBe(false);

    hero.focus = 1;
    hero.update(1);
    expect(ring.visible).toBe(true);
    expect(pulse.scale.x).toBeGreaterThan(1);
  });
});
