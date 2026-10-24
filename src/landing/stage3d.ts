// The 3D layer of the stage: forest, ground, hero tree and carbon particles behind the story.
// Everything the story changes lives in one plain object, `rig`; the scroll timeline tweens its numbers
// and render() reads them. GSAP never touches three.js directly.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { createCarbon } from '../../../three-assets/src/carbon.js';
import { createForest } from '../../../three-assets/src/forest.js';
import { createGround } from '../../../three-assets/src/ground.js';
import { createHeroTree } from '../../../three-assets/src/hero-tree.js';
import { HEX } from '../../../three-assets/src/palette.js';
import {
  createBirds,
  createClouds,
  createLeaves,
  createMountains,
} from '../../../three-assets/src/sky.js';
import { treeUniforms } from '../../../three-assets/src/tree.js';
import type { Rig } from './types';

const CAMERA = { fov: 42, near: 0.1, far: 600 }; // far enough for the ridges at z -330
const FOG = { near: 28, far: 120, dimNear: 1.5, dimFar: 16 };
const LIGHT = {
  sky: '#FFFFFF',
  hemisphere: 1.6,
  sun: '#FFF1D6',
  sunPower: 2.4,
  sunX: 12,
  sunY: 20,
  sunZ: 8,
};
const MS_PER_SECOND = 1000;
const LOAD = {
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

const START_RIG: Rig = {
  px: 0,
  py: 5.5,
  pz: 26,
  lx: 0,
  ly: 6,
  lz: 0,
  dim: 0,
  grow: 1,
  heroGrowth: 0,
  focus: 0,
  carbon: 0,
  cluster: 0,
  clouds: 1,
  wind: 1,
};

type Load = (typeof LOAD)['desktop'];

function createWorld(load: Load) {
  const ground = createGround();
  // the shared JS infers its option defaults as literal types, so the options are cast
  const forest = createForest({ count: load.forest, heightAt: ground.heightAt } as never);
  const hero = createHeroTree();
  const carbon = createCarbon({ sources: forest.tops, count: load.carbon } as never);
  const clouds = createClouds({ count: load.clouds });
  const mountains = createMountains();
  const birds = createBirds({ count: load.birds });
  const leaves = createLeaves({ count: load.leaves });

  return { ground, forest, hero, carbon, clouds, mountains, birds, leaves };
}

type World = ReturnType<typeof createWorld>;

function createScene(world: World) {
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

function applyRig(world: World, rig: Rig, time: number): void {
  const { hero, carbon, clouds, birds } = world;
  treeUniforms.uGrow.value = rig.grow;
  treeUniforms.uCluster.value = rig.cluster;
  treeUniforms.uWind.value = rig.wind;
  treeUniforms.uTime.value = time;
  hero.growth = rig.heroGrowth;
  hero.focus = rig.focus;
  hero.update(time);
  carbon.uniforms.uProgress.value = rig.carbon;
  carbon.uniforms.uTime.value = time;
  clouds.opacity = rig.clouds;
  clouds.update(time);
  birds.update(time);
}

interface Watch {
  host: HTMLElement;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  world: World;
  render: () => void;
  still: boolean;
  pixelRatio: number;
  rig: Rig;
}

/** Keeps the canvas sized to its host, runs the frame loop only while the stage is on screen. */
function watchHost({
  host,
  renderer,
  camera,
  world,
  render,
  still,
  pixelRatio,
  rig,
}: Watch): Stage3D {
  const resize = (): void => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) {
      return;
    }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    world.carbon.resize(height, camera.fov, pixelRatio);
    if (still) {
      render();
    }
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  // one loop: GSAP updates the rig, then the frame renders. Stops while the stage is off screen.
  let running = false;
  const run = (active: boolean): void => {
    if (still || active === running) {
      return;
    }
    running = active;
    if (active) {
      gsap.ticker.add(render);
    } else {
      gsap.ticker.remove(render);
    }
  };
  const visibility = new IntersectionObserver(([entry]) => run(entry.isIntersecting));
  visibility.observe(host);
  if (still) {
    render();
  }

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    host.classList.add('gl-lost'); // CSS shows the plain paper background instead
  });

  return {
    rig,
    render,
    dispose() {
      run(false);
      visibility.disconnect();
      resizeObserver.disconnect();
      Object.values(world).forEach((asset) => asset.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export interface Stage3D {
  rig: Rig;
  render: () => void;
  dispose: () => void;
}

export function createStage3D(host: HTMLElement, { mobile = false, still = false } = {}): Stage3D {
  const rig = { ...START_RIG };
  const load = mobile ? LOAD.mobile : LOAD.desktop;
  const pixelRatio = Math.min(devicePixelRatio, load.pixelRatio);
  const renderer = new THREE.WebGLRenderer({
    antialias: load.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const world = createWorld(load);
  const scene = createScene(world);
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);

  const render = (): void => {
    const time = performance.now() / MS_PER_SECOND;
    camera.position.set(rig.px, rig.py, rig.pz);
    camera.lookAt(rig.lx, rig.ly, rig.lz);
    // dim pulls the fog in until the scene becomes a calm, paper-coloured backdrop for the 2D beats
    const fog = scene.fog as THREE.Fog;
    fog.near = THREE.MathUtils.lerp(FOG.near, FOG.dimNear, rig.dim);
    fog.far = THREE.MathUtils.lerp(FOG.far, FOG.dimFar, rig.dim);
    applyRig(world, rig, time);
    world.leaves.update(time, camera.position);
    renderer.render(scene, camera);
  };

  return watchHost({ host, renderer, camera, world, render, still, pixelRatio, rig });
}
