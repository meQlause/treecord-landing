// The scene the stage shows: the world's parts, the light, the fog. Pure three.js, no renderer, so the
// budgets (draw calls, lights, load per device) can be tested without a GPU.
import * as THREE from 'three';
import { createBirds } from './birds';
import { createCarbon } from './carbon';
import { createClouds } from './clouds';
import { createForest } from './forest';
import { createGround } from './ground';
import { createHeroTree } from './hero-tree';
import { createLeaves } from './leaves';
import { createMountains } from './mountains';
import { HEX } from './palette';

export const FOG = { near: 28, far: 120, dimNear: 1.5, dimFar: 16 };
const LIGHT = {
  sky: '#FFFFFF',
  hemisphere: 1.6,
  sun: '#FFF1D6',
  sunPower: 2.4,
  sunX: 12,
  sunY: 20,
  sunZ: 8,
};
export const LOAD = {
  desktop: {
    forest: 4000,
    carbon: 2400,
    clouds: 30,
    birds: 14,
    leaves: 150,
    pixelRatio: 2,
    antialias: true,
  },
  mobile: {
    forest: 1200,
    carbon: 1200,
    clouds: 16,
    birds: 8,
    leaves: 70,
    pixelRatio: 1.5,
    antialias: false,
  },
};

export type Load = (typeof LOAD)['desktop'];

export function createWorld(load: Load) {
  const ground = createGround();
  const forest = createForest({ count: load.forest, heightAt: ground.heightAt });
  const hero = createHeroTree();
  const carbon = createCarbon({ sources: forest.tops, count: load.carbon });
  const clouds = createClouds({ count: load.clouds });
  const mountains = createMountains();
  const birds = createBirds({ count: load.birds });
  const leaves = createLeaves({ count: load.leaves });

  return { ground, forest, hero, carbon, clouds, mountains, birds, leaves };
}

export type World = ReturnType<typeof createWorld>;

export function createScene(world: World) {
  const background = new THREE.Color(HEX.bg);
  const scene = new THREE.Scene();
  scene.background = background;
  scene.fog = new THREE.Fog(background, FOG.near, FOG.far);
  scene.add(new THREE.HemisphereLight(LIGHT.sky, HEX.earth, LIGHT.hemisphere));
  const sun = new THREE.DirectionalLight(LIGHT.sun, LIGHT.sunPower);
  sun.position.set(LIGHT.sunX, LIGHT.sunY, LIGHT.sunZ);
  scene.add(sun);
  const { ground, forest, hero, carbon, clouds, mountains, birds, leaves } = world;
  scene.add(ground.mesh, forest.group, hero.group, carbon.points);
  scene.add(clouds.group, mountains.group, birds.group, leaves.group);

  return scene;
}
