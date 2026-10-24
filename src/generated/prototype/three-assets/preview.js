// Preview harness for the five assets. Not part of the landing page: it only wires
// renderer, lights, camera presets and a GUI around the modules in ./src.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import {
  treeUniforms,
  createTreeMaterial,
  createBroadleafGeometry,
  createConiferGeometry,
} from './src/tree.js';
import { createGround } from './src/ground.js';
import { createForest } from './src/forest.js';
import { createHeroTree } from './src/hero-tree.js';
import { createCarbon } from './src/carbon.js';

const BG = new THREE.Color('#F7F6F2');
const isMobile = matchMedia('(pointer: coarse)').matches;
const pixelRatio = Math.min(devicePixelRatio, isMobile ? 1.5 : 2);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = BG;
scene.fog = new THREE.Fog(BG, 28, 120);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 300);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight('#FFFFFF', '#8B5E3C', 1.6));
const sun = new THREE.DirectionalLight('#FFF1D6', 2.4);
sun.position.set(12, 20, 8);
scene.add(sun);

// ---------------------------------------------------------------- assets
const ground = createGround();
const forest = createForest({ count: isMobile ? 1200 : 4000, heightAt: ground.heightAt });
const hero = createHeroTree();
const carbon = createCarbon({ sources: forest.tops });
scene.add(ground.mesh, forest.group, hero.group, carbon.points);

// lineup: every species variant plus the hero at four growth stages
const lineup = new THREE.Group();
const staticMaterial = createTreeMaterial('static');
[1, 2, 3, 4, 5, 6].forEach((s, i) => {
  const mesh = new THREE.Mesh(
    s <= 3 ? createBroadleafGeometry(s) : createConiferGeometry(s),
    staticMaterial,
  );
  mesh.position.set(-5.5 + i * 2.2, 0, 4); // Object3D.position is read-only, so set it in place
  lineup.add(mesh);
});
const stages = [0, 0.2, 0.4, 1].map((g, i) => {
  const h = createHeroTree({ seed: 11 });
  h.growth = g;
  h.group.position.set(-6.9 + i * 4.6, 0, -3);
  lineup.add(h.group);
  return h;
});
lineup.visible = false;
scene.add(lineup);

// ---------------------------------------------------------------- views
const VIEWS = {
  Scene: [ground.mesh, forest.group, hero.group, carbon.points],
  Lineup: [ground.mesh, lineup],
  Forest: [ground.mesh, forest.group],
  'Hero tree': [ground.mesh, hero.group],
  Ground: [ground.mesh],
  Carbon: [ground.mesh, forest.group, carbon.points],
};
const PRESETS = {
  'B0 hero wide': { pos: [0, 9, 26], look: [0, 2, 0] },
  'B1 focus tree': { pos: [1.4, 2.2, 10], look: [0, 3.3, 0] },
  'B2 pan right': { pos: [12, 6, 20], look: [12, 2, 0] },
  'B6 carbon high': { pos: [0, 24, 40], look: [0, 10, -16] },
  Lineup: { pos: [0, 8, 19], look: [0, 1.8, 0] },
};

function setView(name) {
  const visible = new Set(VIEWS[name]);
  [ground.mesh, forest.group, hero.group, carbon.points, lineup].forEach(
    (o) => (o.visible = visible.has(o)),
  );
}

let fly = null;
function goTo(name, instant = false) {
  const p = PRESETS[name];
  const pos = new THREE.Vector3(...p.pos);
  const look = new THREE.Vector3(...p.look);
  if (instant) {
    camera.position.copy(pos);
    controls.target.copy(look);
  } else fly = { pos, look };
}
controls.addEventListener('start', () => (fly = null));

// tiny tween runner so the preview needs nothing but three
const tweens = [];
const play = (obj, key, from, to, duration) => tweens.push({ obj, key, from, to, duration, t: 0 });
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

// ---------------------------------------------------------------- GUI
const state = { view: 'Scene', preset: 'B0 hero wide' };
const gui = new GUI({ title: 'Treecord 3D assets' });
gui.add(state, 'view', Object.keys(VIEWS)).onChange(setView);
gui
  .add(state, 'preset', Object.keys(PRESETS))
  .name('camera')
  .onChange((n) => goTo(n));

const fForest = gui.addFolder('Forest');
fForest.add(treeUniforms.uGrow, 'value', 0, 1, 0.001).name('grow').listen();
fForest.add(treeUniforms.uWind, 'value', 0, 3, 0.01).name('wind');
fForest.add(treeUniforms.uCluster, 'value', 0, 1, 0.001).name('clusters').listen();
fForest
  .add({ intro: () => play(treeUniforms.uGrow, 'value', 0, 1, 3.5) }, 'intro')
  .name('▶ play intro');

const fHero = gui.addFolder('Hero tree');
fHero.add(hero.uniforms.uHeroGrow, 'value', 0, 1, 0.001).name('growth').listen();
fHero.add(hero, 'focus', 0, 1, 0.001).name('focus halo').listen();
fHero
  .add({ grow: () => play(hero.uniforms.uHeroGrow, 'value', 0, 1, 4) }, 'grow')
  .name('▶ seedling → mature');

const fCarbon = gui.addFolder('Carbon');
fCarbon.add(carbon.uniforms.uProgress, 'value', 0, 1, 0.001).name('progress').listen();
fCarbon
  .add({ go: () => play(carbon.uniforms.uProgress, 'value', 0, 1, 4) }, 'go')
  .name('▶ rise to token');

// ?view=Lineup&preset=Lineup&grow=1&hero=0.5&carbon=1&focus=1 for quick links and screenshots
const q = new URLSearchParams(location.search);
if (VIEWS[q.get('view')]) state.view = q.get('view');
if (PRESETS[q.get('preset')]) state.preset = q.get('preset');
if (q.has('grow')) treeUniforms.uGrow.value = +q.get('grow');
if (q.has('hero')) hero.growth = +q.get('hero');
if (q.has('carbon')) carbon.uniforms.uProgress.value = +q.get('carbon');
if (q.has('focus')) hero.focus = +q.get('focus');
if (q.has('clusters')) treeUniforms.uCluster.value = +q.get('clusters');
gui.controllersRecursive().forEach((c) => c.updateDisplay());
setView(state.view);
goTo(state.preset, true);

// ---------------------------------------------------------------- loop
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  carbon.resize(innerHeight, camera.fov, pixelRatio);
}
addEventListener('resize', resize);
resize();

const hud = document.getElementById('hud');
const timer = new THREE.Timer();
timer.connect(document);
let hudAt = 0;
let frames = 0;

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 0.1);
  const t = timer.getElapsed();

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const p = Math.min(tw.t / tw.duration, 1);
    tw.obj[tw.key] = tw.from + (tw.to - tw.from) * easeInOut(p);
    if (p === 1) tweens.splice(i, 1);
  }
  if (fly) {
    const k = 1 - Math.exp(-dt * 2.5);
    camera.position.lerp(fly.pos, k);
    controls.target.lerp(fly.look, k);
    if (camera.position.distanceTo(fly.pos) < 0.01) fly = null;
  }

  treeUniforms.uTime.value = t;
  carbon.uniforms.uTime.value = t;
  hero.update(t);
  stages.forEach((s) => s.update(t));
  controls.update();
  renderer.render(scene, camera);

  frames++;
  if (t - hudAt > 0.5) {
    const { calls, triangles } = renderer.info.render;
    hud.innerHTML = `<b>${Math.round(frames / (t - hudAt))} fps</b> · ${calls} draw calls · ${(triangles / 1000).toFixed(0)}k tris · ${forest.count} trees`;
    hudAt = t;
    frames = 0;
  }
});
