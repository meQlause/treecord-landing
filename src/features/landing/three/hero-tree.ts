import * as THREE from 'three';
import { HEX } from './palette';
import { mulberry32, within, type Bounds, type Rng } from './random';
import {
  barkColor,
  createTreeMaterial,
  crownColor,
  finish,
  jitter,
  paintFaces,
  PALETTE,
  prepare,
} from './tree';

const SOIL = new THREE.Color(HEX.soil);
const SOIL_LIGHT = new THREE.Color(HEX.soilLight);
const HALO_COLOR = new THREE.Color(HEX.verified);
const scratch = new THREE.Color();
const VEC3 = 3;
const HALF = 0.5;
const SIDES = [-1, 1];

const TRUNK = { height: 1.9, top: 0.11, bottom: 0.22, sides: 7, segments: 4, jitter: 0.03 };
const BRANCH = {
  length: 0.8,
  top: 0.035,
  bottom: 0.07,
  sides: 5,
  jitter: 0.01,
  tiltZ: -0.75,
  turnY: 0.6,
  joint: 1.25,
  growFrom: 0.1,
  growTo: 0.35,
};
// crown blobs, lower ones first, the crown top last
const BLOBS = [
  { x: -0.75, y: 2.35, z: 0.2, r: 0.75 },
  { x: 0.8, y: 2.4, z: -0.15, r: 0.78 },
  { x: 0.1, y: 2.3, z: 0.75, r: 0.7 },
  { x: -0.2, y: 2.45, z: -0.75, r: 0.72 },
  { x: 0, y: 2.75, z: 0, r: 0.95 },
  { x: 0.35, y: 3.25, z: 0.1, r: 0.6 },
];
const CROWN = {
  first: 0.06,
  step: 0.07,
  span: 0.3,
  size: { min: 0.95, max: 1.05 } as Bounds,
  jitter: 0.12,
  squash: 0.85,
  seedStride: 13,
  pivotDrop: 0.3,
  low: 1.7,
  high: 3.7,
};
const SPROUT = {
  radius: 0.55,
  stretchX: 1.7,
  stretchY: 0.3,
  stretchZ: 0.8,
  tilt: 0.45,
  offset: 0.7,
  lift: 0.25,
  growFrom: 0.08,
  growTo: 0.3,
  shade: 0.9,
  shadeSpread: 0.2,
};
const MOUND = { top: 0.85, bottom: 1.2, height: 0.16, sides: 10, jitter: 0.04, lift: 0.06 };
const HALO = {
  inner: 1.7,
  outer: 1.85,
  segments: 72,
  lift: 0.04,
  ring: 0.85,
  pulseGrow: 1.6,
  pulseOpacity: 0.6,
  rate: 0.45,
  threshold: 0.001,
};

const bark = (_posX: number, _posY: number, _posZ: number, shade: number): THREE.Color =>
  barkColor(shade);

const trunkPart = (seed: number): THREE.BufferGeometry => {
  const cylinder = new THREE.CylinderGeometry(
    TRUNK.top,
    TRUNK.bottom,
    TRUNK.height,
    TRUNK.sides,
    TRUNK.segments,
  );
  const trunk = jitter(cylinder, TRUNK.jitter, seed).translate(0, TRUNK.height * HALF, 0);

  return paintFaces(prepare(trunk), bark);
};

const branchParts = (seed: number): THREE.BufferGeometry[] =>
  SIDES.map((side) => {
    const cylinder = new THREE.CylinderGeometry(
      BRANCH.top,
      BRANCH.bottom,
      BRANCH.length,
      BRANCH.sides,
    );
    const branch = jitter(cylinder, BRANCH.jitter, seed + side)
      .translate(0, BRANCH.length * HALF, 0)
      .rotateZ(side * BRANCH.tiltZ)
      .rotateY(side * BRANCH.turnY)
      .translate(0, BRANCH.joint, 0);
    const pivot = [0, BRANCH.joint, 0];

    return paintFaces(
      prepare(branch, { pivot, grow: [BRANCH.growFrom, BRANCH.growTo, 0, 0] }),
      bark,
    );
  });

const crownParts = (rng: Rng, seed: number): THREE.BufferGeometry[] =>
  BLOBS.map(({ x: posX, y: posY, z: posZ, r: radius }, index) => {
    const start = CROWN.first + index * CROWN.step;
    const blob = jitter(
      new THREE.IcosahedronGeometry(radius * within(rng, CROWN.size), 1),
      radius * CROWN.jitter,
      seed * CROWN.seedStride + index,
    )
      .scale(1, CROWN.squash, 1)
      .translate(posX, posY, posZ);
    const pivot = [posX, posY - radius * CROWN.pivotDrop, posZ];

    return paintFaces(
      prepare(blob, { pivot, grow: [start, start + CROWN.span, 0, 0] }),
      (_posX, height, _posZ, shade) => crownColor(height, CROWN.low, CROWN.high, shade),
    );
  });

// sprout leaves sit on the trunk top in full-size coordinates; at seedling scale (14%) they read as two small leaves
const sproutParts = (): THREE.BufferGeometry[] =>
  SIDES.map((side) => {
    const leaf = new THREE.IcosahedronGeometry(SPROUT.radius, 0)
      .scale(SPROUT.stretchX, SPROUT.stretchY, SPROUT.stretchZ)
      .rotateZ(side * SPROUT.tilt)
      .translate(side * SPROUT.offset, TRUNK.height + SPROUT.lift, 0);
    const pivot = [0, TRUNK.height, 0];

    return paintFaces(
      prepare(leaf, { pivot, grow: [SPROUT.growFrom, SPROUT.growTo, 1, 1] }),
      (_posX, _posY, _posZ, shade) =>
        scratch.copy(PALETTE.sprout).multiplyScalar(SPROUT.shade + shade * SPROUT.shadeSpread),
    );
  });

/**
 * One merged mesh. The shader scales the whole tree from seedling size (14%) to full over
 * growth 0 .. 0.7, and each part pops in around its own pivot (aPivot) on its own schedule (aGrow):
 *   growth 0      seedling: thin stem + two sprout leaves
 *   0.08 .. 0.3   sprouts fall away
 *   0.1 .. 0.35   branches
 *   0.06 .. 0.71  crown blobs pop in, lower ones first, the crown top last
 */
const createTreeGeometry = (seed: number): THREE.BufferGeometry =>
  finish([
    trunkPart(seed),
    ...branchParts(seed),
    ...crownParts(mulberry32(seed), seed),
    ...sproutParts(),
  ]);

/** Low-poly planting mound: marks the spot from the seedling stage on. */
function createMound(seed: number): THREE.Mesh {
  const cylinder = new THREE.CylinderGeometry(
    MOUND.top,
    MOUND.bottom,
    MOUND.height,
    MOUND.sides,
    1,
  );
  const geometry = jitter(cylinder, MOUND.jitter, seed).translate(0, MOUND.lift, 0).toNonIndexed();
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(
      new Float32Array(geometry.attributes.position.count * VEC3),
      VEC3,
    ),
  );
  paintFaces(geometry, (_posX, _posY, _posZ, shade) => scratch.lerpColors(SOIL, SOIL_LIGHT, shade));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
  });

  return new THREE.Mesh(geometry, material);
}

function createHalo() {
  const geometry = new THREE.RingGeometry(HALO.inner, HALO.outer, HALO.segments).rotateX(
    -Math.PI / 2,
  );
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: HALO_COLOR,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const pulseMaterial = ringMaterial.clone();
  const ring = new THREE.Mesh(geometry, ringMaterial);
  const pulse = new THREE.Mesh(geometry, pulseMaterial);
  ring.position.y = HALO.lift;
  pulse.position.y = HALO.lift;

  return { ring, pulse };
}

export interface HeroTree {
  group: THREE.Group;
  uniforms: { uHeroGrow: THREE.IUniform<number> };
  /** 0..1, seedling to mature */
  growth: number;
  /** 0..1, ground halo */
  focus: number;
  update: (seconds: number) => void;
  dispose: () => void;
}

/**
 * The tree the story follows (B1 focus, B5 growth over 36 months).
 * hero.growth 0..1 (seedling to mature), hero.focus 0..1 (ground halo), hero.update(seconds) each frame.
 */
export function createHeroTree({ seed = 11, scale = 1.6 } = {}): HeroTree {
  const uniforms = { uHeroGrow: { value: 1 } };
  const treeMaterial = createTreeMaterial('parts', uniforms);
  const tree = new THREE.Mesh(createTreeGeometry(seed), treeMaterial);
  tree.scale.setScalar(scale);
  const mound = createMound(seed);
  const { ring, pulse } = createHalo();
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
    set growth(value: number) {
      uniforms.uHeroGrow.value = value;
    },
    get focus() {
      return focus;
    },
    set focus(value: number) {
      focus = value;
    },
    update(seconds) {
      const phase = (seconds * HALO.rate) % 1;
      (ring.material as THREE.MeshBasicMaterial).opacity = focus * HALO.ring;
      pulse.scale.setScalar(1 + phase * HALO.pulseGrow);
      (pulse.material as THREE.MeshBasicMaterial).opacity = focus * (1 - phase) * HALO.pulseOpacity;
      ring.visible = focus > HALO.threshold;
      pulse.visible = ring.visible;
    },
    dispose() {
      group.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          node.material.dispose();
        }
      });
    },
  };
}
