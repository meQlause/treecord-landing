import type { Mesh } from 'three';
import { describe, expect, it } from 'vitest';
import { createHeroTree } from '../../../../../src/features/landing/three/hero-tree';

const treeOf = (seed?: number) => createHeroTree({ seed }).group.children[0] as Mesh;
const positions = (mesh: Mesh) => Array.from(mesh.geometry.attributes.position.array);

describe('createHeroTree', () => {
  it('builds one merged tree mesh whose parts carry a pivot and a growth schedule', () => {
    const { attributes } = treeOf().geometry;

    expect(attributes.aPivot.count).toBe(attributes.position.count);
    expect(attributes.aGrow.count).toBe(attributes.position.count);
    expect(positions(treeOf()).every(Number.isFinite)).toBe(true);
  });

  it('is the same tree for the same seed and a different tree for another', () => {
    expect(positions(treeOf(11))).toEqual(positions(treeOf(11)));
    expect(positions(treeOf(11))).not.toEqual(positions(treeOf(12)));
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

  it('pulses: the halo is a different size at a different moment', () => {
    const hero = createHeroTree();
    const [, , , pulse] = hero.group.children;
    hero.focus = 1;

    hero.update(0.5);
    const early = pulse.scale.x;
    hero.update(1.5);

    expect(pulse.scale.x).not.toBeCloseTo(early);
  });

  it('disposes without throwing', () => {
    expect(() => createHeroTree().dispose()).not.toThrow();
  });
});
