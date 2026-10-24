import * as THREE from 'three';
import { mulberry32, range } from './random.js';
import {
  PALETTE,
  prepare,
  jitter,
  paintFaces,
  crownColor,
  barkColor,
  finish,
  createTreeMaterial,
} from './tree.js';
import { HEX } from './palette.js';

const SOIL = new THREE.Color(HEX.soil);
const SOIL_LIGHT = new THREE.Color(HEX.soilLight);
const HALO = new THREE.Color(HEX.verified);
const tmp = new THREE.Color();

/**
 * One merged mesh. The shader scales the whole tree from seedling size (14%) to full over
 * growth 0 .. 0.7, and each part pops in around its own pivot (aPivot) on its own schedule (aGrow):
 *   growth 0      seedling: thin stem + two sprout leaves
 *   0.08 .. 0.3   sprouts fall away
 *   0.1 .. 0.35   branches
 *   0.06 .. 0.71  crown blobs pop in, lower ones first, the crown top last
 */
function createHeroTreeGeometry(seed) {
  const rng = mulberry32(seed);
  const trunkH = 1.9;
  const parts = [];

  const trunk = jitter(new THREE.CylinderGeometry(0.11, 0.22, trunkH, 7, 4), 0.03, seed).translate(
    0,
    trunkH / 2,
    0,
  );
  parts.push(paintFaces(prepare(trunk), (x, y, z, h) => barkColor(h)));

  for (const side of [-1, 1]) {
    const len = 0.8;
    const branch = jitter(new THREE.CylinderGeometry(0.035, 0.07, len, 5), 0.01, seed + side)
      .translate(0, len / 2, 0)
      .rotateZ(side * -0.75)
      .rotateY(side * 0.6)
      .translate(0, 1.25, 0);
    parts.push(
      paintFaces(prepare(branch, { pivot: [0, 1.25, 0], grow: [0.1, 0.35, 0, 0] }), (x, y, z, h) =>
        barkColor(h),
      ),
    );
  }

  const blobs = [
    [-0.75, 2.35, 0.2, 0.75],
    [0.8, 2.4, -0.15, 0.78],
    [0.1, 2.3, 0.75, 0.7],
    [-0.2, 2.45, -0.75, 0.72],
    [0, 2.75, 0, 0.95],
    [0.35, 3.25, 0.1, 0.6],
  ];
  blobs.forEach(([x, y, z, r], i) => {
    const start = 0.06 + i * 0.07;
    const blob = jitter(
      new THREE.IcosahedronGeometry(r * range(rng, 0.95, 1.05), 1),
      r * 0.12,
      seed * 13 + i,
    )
      .scale(1, 0.85, 1)
      .translate(x, y, z);
    parts.push(
      paintFaces(
        prepare(blob, { pivot: [x, y - r * 0.3, z], grow: [start, start + 0.3, 0, 0] }),
        (px, py, pz, h) => crownColor(py, 1.7, 3.7, h),
      ),
    );
  });

  // sprout leaves sit on the trunk top in full-size coordinates; at seedling scale (14%) they read as two small leaves
  for (const side of [-1, 1]) {
    const leaf = new THREE.IcosahedronGeometry(0.55, 0)
      .scale(1.7, 0.3, 0.8)
      .rotateZ(side * 0.45)
      .translate(side * 0.7, trunkH + 0.25, 0);
    parts.push(
      paintFaces(prepare(leaf, { pivot: [0, trunkH, 0], grow: [0.08, 0.3, 1, 1] }), (x, y, z, h) =>
        tmp.copy(PALETTE.sprout).multiplyScalar(0.9 + h * 0.2),
      ),
    );
  }

  return finish(parts);
}

/** Low-poly planting mound: marks the spot from the seedling stage on. */
function createMoundGeometry(seed) {
  const g = jitter(new THREE.CylinderGeometry(0.85, 1.2, 0.16, 10, 1), 0.04, seed)
    .translate(0, 0.06, 0)
    .toNonIndexed();
  g.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3),
  );
  paintFaces(g, (x, y, z, h) => tmp.lerpColors(SOIL, SOIL_LIGHT, h));
  g.computeVertexNormals();
  return g;
}

/**
 * The tree the story follows (B1 focus, B5 growth over 36 months).
 * hero.growth 0..1 (seedling to mature), hero.focus 0..1 (ground halo), hero.update(seconds) each frame.
 */
export function createHeroTree({ seed = 11, scale = 1.6 } = {}) {
  const uniforms = { uHeroGrow: { value: 1 } };
  const treeGeometry = createHeroTreeGeometry(seed);
  const treeMaterial = createTreeMaterial('parts', uniforms);
  const tree = new THREE.Mesh(treeGeometry, treeMaterial);
  tree.scale.setScalar(scale);

  const moundGeometry = createMoundGeometry(seed);
  const moundMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
  });
  const mound = new THREE.Mesh(moundGeometry, moundMaterial);

  const ringGeometry = new THREE.RingGeometry(1.7, 1.85, 72).rotateX(-Math.PI / 2);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: HALO,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const pulseMaterial = ringMaterial.clone();
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  const pulse = new THREE.Mesh(ringGeometry, pulseMaterial);
  ring.position.y = pulse.position.y = 0.04;

  const group = new THREE.Group();
  group.name = 'hero-tree';
  group.add(tree, mound, ring, pulse);

  let focus = 0;
  return {
    group,
    uniforms,
    get growth() {
      return uniforms.uHeroGrow.value;
    },
    set growth(v) {
      uniforms.uHeroGrow.value = v;
    },
    get focus() {
      return focus;
    },
    set focus(v) {
      focus = v;
    },
    update(seconds) {
      ringMaterial.opacity = focus * 0.85;
      const p = (seconds * 0.45) % 1;
      pulse.scale.setScalar(1 + p * 1.6);
      pulseMaterial.opacity = focus * (1 - p) * 0.6;
      ring.visible = pulse.visible = focus > 0.001;
    },
    dispose() {
      [treeGeometry, moundGeometry, ringGeometry].forEach((g) => g.dispose());
      [treeMaterial, moundMaterial, ringMaterial, pulseMaterial].forEach((m) => m.dispose());
    },
  };
}
