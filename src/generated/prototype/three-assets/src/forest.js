import * as THREE from 'three';
import { mulberry32, range, scatter } from './random.js';
import { HEX } from './palette.js';
import {
  createBroadleafGeometry,
  createConiferGeometry,
  createTreeMaterial,
  treeUniforms,
} from './tree.js';

// Project cluster colours for the carbon beat (B6). Kept leafy on purpose: brown or yellow canopies read as dying forest.
const CLUSTER_COLORS = ['#2E9E5B', '#2F7F86', '#9BBF4A', '#4C78A8', '#5FB8A0'].map(
  (c) => new THREE.Color(c),
);
const WARM = new THREE.Color(HEX.warm);

/**
 * Thousands of trees in 4 draw calls: 2 broadleaf + 2 conifer variants, each an InstancedMesh.
 * Growth (treeUniforms.uGrow) and cluster colouring (treeUniforms.uCluster) run in the vertex shader.
 * `tops` holds one crown-top position per tree (x, y, z), used as particle sources by the carbon asset.
 */
export function createForest({
  seed = 7,
  count = 4000,
  heightAt = () => 0,
  bounds = { minX: -60, maxX: 60, minZ: -100, maxZ: 16 },
  minDist = 1.3,
  // the hero tree's clearing plus a path toward the camera, so the hero shot stays readable
  clearings = [
    { x: 0, z: 0, r: 4 },
    { x: 0.5, z: 6, r: 3.2 },
    { x: 1, z: 11, r: 3.6 },
    { x: 0, z: 16, r: 4 },
  ],
  clusters = 5,
} = {}) {
  const rng = mulberry32(seed);
  const points = scatter({ count, ...bounds, minDist, clearings, rng });

  // detail 0 crowns: about 4x fewer triangles; fog and distance hide the difference
  const variants = [
    createBroadleafGeometry(seed + 1, 0),
    createBroadleafGeometry(seed + 2, 0),
    createConiferGeometry(seed + 3),
    createConiferGeometry(seed + 4),
  ];
  const weights = [0.37, 0.35, 0.14, 0.14];
  const buckets = variants.map(() => []);
  for (const pt of points) {
    let r = rng();
    let v = 0;
    while (v < weights.length - 1 && (r -= weights[v]) > 0) v++;
    buckets[v].push(pt);
  }

  const centers = Array.from({ length: clusters }, () => [
    range(rng, bounds.minX * 0.7, bounds.maxX * 0.7),
    range(rng, bounds.minZ * 0.9, bounds.maxZ),
  ]);
  const nearestCluster = (x, z) => {
    let best = 0;
    let bestD = Infinity;
    centers.forEach(([cx, cz], i) => {
      const d = (x - cx) ** 2 + (z - cz) ** 2;
      if (d < bestD) [best, bestD] = [i, d];
    });
    return best;
  };

  const material = createTreeMaterial('instanced');
  const group = new THREE.Group();
  group.name = 'forest';
  const tops = [];
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const growRadius = 55; // the intro wave spans the part of the forest the hero camera actually sees

  const meshes = buckets.map((items, v) => {
    const geometry = variants[v];
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
    const delay = new Float32Array(items.length);
    const cluster = new Float32Array(items.length * 3);
    const crownTop = geometry.boundingBox.max.y;

    items.forEach(([x, z], i) => {
      const s = range(rng, 0.75, 1.35);
      const sy = s * range(rng, 0.9, 1.15);
      const y = heightAt(x, z) - 0.05;
      dummy.position.set(x, y, z);
      dummy.rotation.set(range(rng, -0.04, 0.04), rng() * Math.PI * 2, range(rng, -0.04, 0.04));
      dummy.scale.set(s, sy, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color
        .setRGB(1, 1, 1)
        .lerp(WARM, rng() * 0.3)
        .multiplyScalar(range(rng, 0.82, 1.12));
      mesh.setColorAt(i, color);

      delay[i] = Math.min(Math.hypot(x, z) / growRadius, 1) * 0.8 + rng() * 0.2; // grows outward from the hero tree
      CLUSTER_COLORS[nearestCluster(x, z)].toArray(cluster, i * 3);
      tops.push(x, y + crownTop * sy * 0.85, z);
    });

    geometry.setAttribute('aDelay', new THREE.InstancedBufferAttribute(delay, 1));
    geometry.setAttribute('aCluster', new THREE.InstancedBufferAttribute(cluster, 3));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere(); // without this, culling uses the single-tree bounds and trees pop out at the edges
    group.add(mesh);
    return mesh;
  });

  return {
    group,
    uniforms: treeUniforms,
    tops: new Float32Array(tops),
    count: points.length,
    dispose() {
      meshes.forEach((m) => m.dispose());
      variants.forEach((g) => g.dispose());
      material.dispose();
    },
  };
}
