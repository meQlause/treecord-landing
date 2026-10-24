import * as THREE from 'three';
import { HEX } from '../../../shared/palette';
import { mulberry32, range, scatter, type Clearing, type Rng } from '../../../shared/random';
import {
  createBroadleafGeometry,
  createConiferGeometry,
  createTreeMaterial,
  treeUniforms,
} from './tree';

// Project cluster colours for the carbon beat (B6). Kept leafy on purpose: brown or yellow canopies read as dying forest.
const CLUSTER_COLORS = ['#2E9E5B', '#2F7F86', '#9BBF4A', '#4C78A8', '#5FB8A0'].map(
  (hex) => new THREE.Color(hex),
);
const WARM = new THREE.Color(HEX.warm);
const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const VEC3 = 3;

// detail 0 crowns: about 4x fewer triangles; fog and distance hide the difference
const VARIANTS = [
  { weight: 0.37, conifer: false, offset: 1 },
  { weight: 0.35, conifer: false, offset: 2 },
  { weight: 0.14, conifer: true, offset: 3 },
  { weight: 0.14, conifer: true, offset: 4 },
];
const makeVariant = (variant: (typeof VARIANTS)[number], seed: number): THREE.BufferGeometry =>
  variant.conifer
    ? createConiferGeometry(seed + variant.offset)
    : createBroadleafGeometry(seed + variant.offset, 0);
const LOOK = {
  scale: { min: 0.75, max: 1.35 },
  stretch: { min: 0.9, max: 1.15 },
  lean: { min: -0.04, max: 0.04 },
  warmth: 0.3,
  shade: { min: 0.82, max: 1.12 },
  sink: 0.05,
  crownShare: 0.85,
  growRadius: 55, // the intro wave spans the part of the forest the hero camera actually sees
  growSpread: 0.8,
  growJitter: 0.2,
  centreX: 0.7,
  centreZ: 0.9,
};

export interface ForestOptions {
  seed?: number;
  count?: number;
  heightAt?: (posX: number, posZ: number) => number;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  minDist?: number;
  clearings?: Clearing[];
  clusters?: number;
}

export interface Forest {
  group: THREE.Group;
  uniforms: typeof treeUniforms;
  tops: Float32Array;
  count: number;
  dispose: () => void;
}

const pickVariant = (rng: Rng): number => {
  let remaining = rng();
  for (let index = 0; index < VARIANTS.length - 1; index += 1) {
    remaining -= VARIANTS[index].weight;
    if (remaining <= 0) {
      return index;
    }
  }

  return VARIANTS.length - 1;
};

const nearestCluster = (centres: number[][], posX: number, posZ: number): number => {
  const distances = centres.map(
    ([centreX, centreZ]) => (posX - centreX) ** 2 + (posZ - centreZ) ** 2,
  );

  return distances.indexOf(Math.min(...distances));
};

interface Planting {
  rng: Rng;
  heightAt: (posX: number, posZ: number) => number;
  centres: number[][];
  mesh: THREE.InstancedMesh;
  delay: Float32Array;
  cluster: Float32Array;
  crownTop: number;
  tops: number[];
}

function plant(plan: Planting, [posX, posZ]: number[], index: number): void {
  const { rng, mesh } = plan;
  const width = range(rng, LOOK.scale.min, LOOK.scale.max);
  const height = width * range(rng, LOOK.stretch.min, LOOK.stretch.max);
  const posY = plan.heightAt(posX, posZ) - LOOK.sink;
  dummy.position.set(posX, posY, posZ);
  dummy.rotation.set(
    range(rng, LOOK.lean.min, LOOK.lean.max),
    rng() * Math.PI * 2,
    range(rng, LOOK.lean.min, LOOK.lean.max),
  );
  dummy.scale.set(width, height, width);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
  tint
    .setRGB(1, 1, 1)
    .lerp(WARM, rng() * LOOK.warmth)
    .multiplyScalar(range(rng, LOOK.shade.min, LOOK.shade.max));
  mesh.setColorAt(index, tint);
  const wave = Math.min(Math.hypot(posX, posZ) / LOOK.growRadius, 1); // grows outward from the hero tree
  plan.delay[index] = wave * LOOK.growSpread + rng() * LOOK.growJitter;
  CLUSTER_COLORS[nearestCluster(plan.centres, posX, posZ)].toArray(plan.cluster, index * VEC3);
  plan.tops.push(posX, posY + plan.crownTop * height * LOOK.crownShare, posZ);
}

interface MeshInput {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: number[][];
  shared: Pick<Planting, 'rng' | 'heightAt' | 'centres' | 'tops'>;
}

function buildMesh({ geometry, material, items, shared }: MeshInput): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const plan: Planting = {
    ...shared,
    mesh,
    delay: new Float32Array(items.length),
    cluster: new Float32Array(items.length * VEC3),
    crownTop: geometry.boundingBox?.max.y ?? 0,
  };
  items.forEach((point, index) => plant(plan, point, index));
  geometry.setAttribute('aDelay', new THREE.InstancedBufferAttribute(plan.delay, 1));
  geometry.setAttribute('aCluster', new THREE.InstancedBufferAttribute(plan.cluster, VEC3));
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
  mesh.computeBoundingSphere(); // without this, culling uses the single-tree bounds and trees pop out at the edges

  return mesh;
}

/**
 * Thousands of trees in 4 draw calls: 2 broadleaf + 2 conifer variants, each an InstancedMesh.
 * Growth (treeUniforms.uGrow) and cluster colouring (treeUniforms.uCluster) run in the vertex shader.
 * `tops` holds one crown-top position per tree (x, y, z), used as particle sources by the carbon asset.
 */
const DEFAULTS = {
  seed: 7,
  count: 4000,
  heightAt: (): number => 0,
  bounds: { minX: -60, maxX: 60, minZ: -100, maxZ: 16 },
  minDist: 1.3,
  // the hero tree's clearing plus a path toward the camera, so the hero shot stays readable
  clearings: [
    { x: 0, z: 0, r: 4 },
    { x: 0.5, z: 6, r: 3.2 },
    { x: 1, z: 11, r: 3.6 },
    { x: 0, z: 16, r: 4 },
  ],
  clusters: 5,
};

export function createForest(options: ForestOptions = {}): Forest {
  const { seed, count, heightAt, bounds, minDist, clearings, clusters } = {
    ...DEFAULTS,
    ...options,
  };
  const rng = mulberry32(seed);
  const points = scatter({ count, ...bounds, minDist, clearings, rng });
  const geometries = VARIANTS.map((variant) => makeVariant(variant, seed));
  const buckets: number[][][] = geometries.map(() => []);
  points.forEach((point) => buckets[pickVariant(rng)].push(point));
  const centres = Array.from({ length: clusters }, () => [
    range(rng, bounds.minX * LOOK.centreX, bounds.maxX * LOOK.centreX),
    range(rng, bounds.minZ * LOOK.centreZ, bounds.maxZ),
  ]);

  const material = createTreeMaterial('instanced');
  const tops: number[] = [];
  const shared = { rng, heightAt, centres, tops };
  const meshes = buckets.map((items, variant) =>
    buildMesh({ geometry: geometries[variant], material, items, shared }),
  );
  const group = new THREE.Group();
  group.name = 'forest';
  group.add(...meshes);

  return {
    group,
    uniforms: treeUniforms,
    tops: new Float32Array(tops),
    count: points.length,
    dispose() {
      meshes.forEach((mesh) => mesh.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
    },
  };
}
