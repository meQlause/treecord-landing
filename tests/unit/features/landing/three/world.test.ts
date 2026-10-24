import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LOAD, createScene, createWorld } from '../../../../../src/features/landing/three/world';

const DRAW_CALL_BUDGET = 100;
const LIGHT_BUDGET = 3;

const everything = (scene: THREE.Scene) => {
  const nodes: THREE.Object3D[] = [];
  scene.traverse((node) => nodes.push(node));

  return nodes;
};

const drawables = (scene: THREE.Scene) =>
  everything(scene).filter((node) => node instanceof THREE.Mesh || node instanceof THREE.Points);

describe('the desktop world', () => {
  const world = createWorld(LOAD.desktop);
  const scene = createScene(world);

  it('stays far under the draw-call budget: every mesh and point cloud is one call', () => {
    expect(drawables(scene).length).toBeLessThan(DRAW_CALL_BUDGET);
  });

  it('uses at most three lights and no shadow map', () => {
    const lights = everything(scene).filter(
      (node): node is THREE.Light => node instanceof THREE.Light,
    );

    expect(lights.length).toBeLessThanOrEqual(LIGHT_BUDGET);
    expect(lights.every((light) => !light.castShadow)).toBe(true);
  });

  it('sits on a paper-coloured background with fog', () => {
    expect((scene.background as THREE.Color).getHexString()).toBe('f7f6f2');
    expect(scene.fog).toBeInstanceOf(THREE.Fog);
  });

  it('plants a forest and one carbon particle set sized for desktop', () => {
    expect(world.forest.count).toBeGreaterThan(1000);
    expect(world.carbon.points.geometry.getAttribute('aStart').count).toBe(LOAD.desktop.carbon);
  });

  it('lets every geometry and material go on dispose', () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    for (const node of drawables(scene) as THREE.Mesh[]) {
      geometries.add(node.geometry);
      [node.material].flat().forEach((material) => materials.add(material));
    }
    const released = new Set<unknown>();
    [...geometries, ...materials].forEach((item) =>
      item.addEventListener('dispose', () => released.add(item)),
    );

    Object.values(world).forEach((asset) => asset.dispose());

    expect(released.size).toBe(geometries.size + materials.size);
  });
});

describe('the mobile world', () => {
  const world = createWorld(LOAD.mobile);

  it('is lighter: 1,200 trees at most, 1,200 particles, fewer clouds, birds and leaves', () => {
    expect(world.forest.count).toBeLessThanOrEqual(LOAD.mobile.forest);
    expect(world.carbon.points.geometry.getAttribute('aStart').count).toBe(1200);
    expect(LOAD.mobile.clouds).toBeLessThan(LOAD.desktop.clouds);
    expect(LOAD.mobile.birds).toBeLessThan(LOAD.desktop.birds);
    expect(LOAD.mobile.leaves).toBeLessThan(LOAD.desktop.leaves);
  });

  it('caps the pixel ratio at 1.5 and skips antialiasing', () => {
    expect(LOAD.mobile.pixelRatio).toBe(1.5);
    expect(LOAD.mobile.antialias).toBe(false);
    expect(LOAD.desktop.pixelRatio).toBe(2);
  });
});
