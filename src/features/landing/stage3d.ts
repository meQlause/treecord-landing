// The 3D layer of the stage: forest, ground, hero tree and carbon particles behind the story.
// Everything the story changes lives in one plain object, `rig`; the scroll timeline tweens its numbers
// and render() reads them. GSAP never touches three.js directly.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { FOG, LOAD, createScene, createWorld, type World } from './three/world';
import { treeUniforms } from './three/tree';
import type { Rig } from './types';

const CAMERA = { fov: 42, near: 0.1, far: 600 }; // far enough for the ridges at z -330
const MS_PER_SECOND = 1000;

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
}

/** Keeps the canvas sized to its host, runs the frame loop only while the stage is on screen. */
function watchHost({ host, renderer, camera, world, render, still, pixelRatio }: Watch): Stage3D {
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

  const onLost = (event: Event): void => {
    event.preventDefault();
    host.classList.add('gl-lost'); // the plain paper background shows instead
    renderer.domElement.style.display = 'none'; // three sets display inline, which beats the .gl-lost rule
  };
  renderer.domElement.addEventListener('webglcontextlost', onLost);

  return {
    render,
    dispose() {
      run(false);
      visibility.disconnect();
      resizeObserver.disconnect();
      Object.values(world).forEach((asset) => asset.dispose());
      renderer.domElement.removeEventListener('webglcontextlost', onLost); // letting go is not a loss
      renderer.dispose();
      renderer.forceContextLoss(); // browsers cap live contexts: release this one now, not at garbage collection
      renderer.domElement.remove();
    },
  };
}

export interface Stage3D {
  render: () => void;
  dispose: () => void;
}

export function createStage3D(
  host: HTMLElement,
  rig: Rig,
  { mobile = false, still = false } = {},
): Stage3D {
  const load = mobile ? LOAD.mobile : LOAD.desktop;
  const pixelRatio = Math.min(devicePixelRatio, load.pixelRatio);
  const renderer = new THREE.WebGLRenderer({
    antialias: load.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.classList.remove('gl-lost'); // a new stage starts clean
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

  return watchHost({ host, renderer, camera, world, render, still, pixelRatio });
}
