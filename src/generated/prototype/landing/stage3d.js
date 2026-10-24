// The 3D layer of the stage: forest, ground, hero tree and carbon particles behind the story.
// Everything the story changes lives in one plain object, `rig`; the scroll timeline tweens its numbers
// and render() reads them. GSAP never touches three.js directly.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { treeUniforms } from '../three-assets/src/tree.js';
import { createGround } from '../three-assets/src/ground.js';
import { createForest } from '../three-assets/src/forest.js';
import { createHeroTree } from '../three-assets/src/hero-tree.js';
import { createCarbon } from '../three-assets/src/carbon.js';
import {
  createClouds,
  createMountains,
  createBirds,
  createLeaves,
} from '../three-assets/src/sky.js';
import { HEX } from '../three-assets/src/palette.js';

/** Camera pose + scene state. p* = camera position, l* = look-at target. */
export const POSE_KEYS = [
  'px',
  'py',
  'pz',
  'lx',
  'ly',
  'lz',
  'dim',
  'heroGrowth',
  'focus',
  'carbon',
  'cluster',
  'clouds',
];

export function createStage3D(host, { mobile = false, still = false } = {}) {
  const rig = {
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
  const BG = new THREE.Color(HEX.bg);
  const pixelRatio = Math.min(devicePixelRatio, mobile ? 1.5 : 2);

  const renderer = new THREE.WebGLRenderer({
    antialias: !mobile,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 28, 120);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600); // far enough for the ridges at z -330
  scene.add(new THREE.HemisphereLight('#FFFFFF', HEX.earth, 1.6));
  const sun = new THREE.DirectionalLight('#FFF1D6', 2.4);
  sun.position.set(12, 20, 8);
  scene.add(sun);

  const ground = createGround();
  const forest = createForest({ count: mobile ? 1200 : 4000, heightAt: ground.heightAt });
  const hero = createHeroTree();
  const carbon = createCarbon({ sources: forest.tops, count: mobile ? 1200 : 2400 });
  const clouds = createClouds({ count: mobile ? 16 : 30 });
  const mountains = createMountains();
  const birds = createBirds({ count: mobile ? 8 : 14 });
  const leaves = createLeaves({ count: mobile ? 70 : 150 });
  const life = [clouds, mountains, birds, leaves];
  scene.add(ground.mesh, forest.group, hero.group, carbon.points, ...life.map((a) => a.group));

  const lerp = THREE.MathUtils.lerp;
  function render() {
    const t = performance.now() / 1000;
    camera.position.set(rig.px, rig.py, rig.pz);
    camera.lookAt(rig.lx, rig.ly, rig.lz);
    // dim pulls the fog in until the scene becomes a calm, paper-coloured backdrop for the 2D beats
    scene.fog.near = lerp(28, 1.5, rig.dim);
    scene.fog.far = lerp(120, 16, rig.dim);
    treeUniforms.uGrow.value = rig.grow;
    treeUniforms.uCluster.value = rig.cluster;
    treeUniforms.uWind.value = rig.wind;
    treeUniforms.uTime.value = t;
    hero.growth = rig.heroGrowth;
    hero.focus = rig.focus;
    hero.update(t);
    carbon.uniforms.uProgress.value = rig.carbon;
    carbon.uniforms.uTime.value = t;
    clouds.opacity = rig.clouds;
    clouds.update(t);
    birds.update(t);
    leaves.update(t, camera.position);
    renderer.render(scene, camera);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    carbon.resize(h, camera.fov, pixelRatio);
    if (still) render();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // one loop: GSAP updates the rig, then the frame renders. Stops while the stage is off screen.
  let running = false;
  const run = (on) => {
    if (still || on === running) return;
    running = on;
    on ? gsap.ticker.add(render) : gsap.ticker.remove(render);
  };
  const io = new IntersectionObserver(([e]) => run(e.isIntersecting));
  io.observe(host);
  if (still) render();

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    host.classList.add('gl-lost'); // CSS shows the plain paper background instead
  });

  return {
    rig,
    render,
    dispose() {
      run(false);
      io.disconnect();
      ro.disconnect();
      [ground, forest, hero, carbon, ...life].forEach((a) => a.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
