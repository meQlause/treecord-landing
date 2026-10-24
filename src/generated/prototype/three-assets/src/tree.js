import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, range, hash3 } from './random.js';
import { HEX } from './palette.js';

export const PALETTE = Object.fromEntries(
  ['bark', 'barkLight', 'leafDark', 'leafMid', 'leafLight', 'sprout'].map((k) => [
    k,
    new THREE.Color(HEX[k]),
  ]),
);

const tmp = new THREE.Color();

/**
 * Shared uniforms for every tree material. Tween `.value` from GSAP:
 * uGrow 0..1 (forest grows outward from the hero tree), uWind (sway strength),
 * uCluster 0..1 (recolour instances by project cluster), uTime (seconds).
 */
export const treeUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
  uGrow: { value: 1 },
  uCluster: { value: 0 },
};

// ---------------------------------------------------------------- geometry helpers

/** Non-indexed copy with the attribute set every tree part shares, so parts can be merged. */
export function prepare(geometry, { pivot = [0, 0, 0], grow = [0, 0, 1, 0] } = {}) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const n = g.attributes.position.count;
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute(
    'aPivot',
    new THREE.Float32BufferAttribute(
      new Float32Array(n * 3).map((_, i) => pivot[i % 3]),
      3,
    ),
  );
  g.setAttribute(
    'aGrow',
    new THREE.Float32BufferAttribute(
      new Float32Array(n * 4).map((_, i) => grow[i % 4]),
      4,
    ),
  );
  return g;
}

/** Moves each vertex by a hash of its own position, so shared corners move together (no cracks). */
export function jitter(geometry, amount, k = 0) {
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    p.setXYZ(
      i,
      x + (hash3(x, y, z, k) - 0.5) * 2 * amount,
      y + (hash3(x, y, z, k + 1) - 0.5) * 2 * amount,
      z + (hash3(x, y, z, k + 2) - 0.5) * 2 * amount,
    );
  }
  return geometry;
}

/** One colour per triangle (the low-poly mosaic look). `fn(cx, cy, cz, hash)` returns a THREE.Color. */
export function paintFaces(geometry, fn) {
  const p = geometry.attributes.position;
  const c = geometry.attributes.color;
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const col = fn(cx, cy, cz, hash3(cx, cy, cz, 7));
    for (let j = 0; j < 3; j++) c.setXYZ(i + j, col.r, col.g, col.b);
  }
  return geometry;
}

/** Foliage gradient: dark underside (fake ambient occlusion), lighter sunlit top. */
export function crownColor(y, y0, y1, h) {
  const t = THREE.MathUtils.clamp((y - y0) / (y1 - y0), 0, 1);
  tmp.lerpColors(PALETTE.leafDark, PALETTE.leafMid, Math.min(t * 1.6, 1));
  if (t > 0.55) tmp.lerp(PALETTE.leafLight, ((t - 0.55) / 0.45) * 0.85);
  return tmp.multiplyScalar(0.88 + h * 0.24);
}

export const barkColor = (h) => tmp.lerpColors(PALETTE.bark, PALETTE.barkLight, h * 0.7);

export function finish(parts) {
  const geometry = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

// ---------------------------------------------------------------- species

/**
 * Tropical broadleaf (trembesi / mahogany silhouette): short trunk, clustered round crown. Base at y = 0.
 * detail 0 (20 faces per blob) for the forest, 1 (80 faces) for close-ups.
 */
export function createBroadleafGeometry(seed = 1, detail = 1) {
  const rng = mulberry32(seed);
  const trunkH = range(rng, 1.1, 1.5);
  const parts = [];

  const trunk = prepare(
    jitter(new THREE.CylinderGeometry(0.08, 0.15, trunkH, 6, 2), 0.02, seed).translate(
      0,
      trunkH / 2,
      0,
    ),
  );
  parts.push(paintFaces(trunk, (x, y, z, h) => barkColor(h)));

  const blobs = 4 + Math.floor(rng() * 2);
  for (let i = 0; i < blobs; i++) {
    const r = range(rng, 0.5, 0.78);
    const angle = (i / blobs) * Math.PI * 2 + rng();
    const d = i === 0 ? 0 : range(rng, 0.35, 0.6);
    const y = trunkH + (i === 0 ? 0.85 : range(rng, 0.3, 0.75));
    const blob = jitter(
      new THREE.IcosahedronGeometry(r, detail),
      r * (detail ? 0.12 : 0.08),
      seed * 31 + i,
    )
      .scale(1, 0.82, 1)
      .translate(Math.cos(angle) * d, y, Math.sin(angle) * d);
    parts.push(
      paintFaces(prepare(blob), (x, cy, z, h) => crownColor(cy, trunkH - 0.2, trunkH + 1.7, h)),
    );
  }
  return finish(parts);
}

/** Tiered conifer (cemara / pine silhouette): thin trunk, 3 to 4 stacked cones. Base at y = 0. */
export function createConiferGeometry(seed = 1) {
  const rng = mulberry32(seed);
  const trunkH = range(rng, 0.9, 1.2);
  const tiers = 3 + Math.floor(rng() * 2);
  const parts = [];

  const trunk = prepare(
    jitter(new THREE.CylinderGeometry(0.05, 0.1, trunkH + 0.6, 5, 2), 0.015, seed).translate(
      0,
      (trunkH + 0.6) / 2,
      0,
    ),
  );
  parts.push(paintFaces(trunk, (x, y, z, h) => barkColor(h)));

  const base = trunkH * 0.7;
  let top = base;
  for (let i = 0; i < tiers; i++) {
    const k = i / (tiers - 1);
    const radius = THREE.MathUtils.lerp(0.95, 0.38, k) * range(rng, 0.9, 1.1);
    const height = range(rng, 0.95, 1.15) * (1 - i * 0.1);
    const y = base + i * 0.55 + height / 2;
    top = y + height / 2;
    const cone = jitter(new THREE.ConeGeometry(radius, height, 7, 1), radius * 0.08, seed * 17 + i)
      .rotateY(rng() * Math.PI)
      .translate(0, y, 0);
    parts.push(cone);
  }
  // paint cones after we know the full crown height
  for (let i = 1; i < parts.length; i++) {
    parts[i] = paintFaces(prepare(parts[i]), (x, y, z, h) => crownColor(y, base, top, h));
  }
  return finish(parts);
}

// ---------------------------------------------------------------- material

const VERTEX_HEAD = /* glsl */ `
uniform float uTime;
uniform float uWind;
#ifdef TREE_INSTANCED
  uniform float uGrow;
  uniform float uCluster;
  attribute float aDelay;
  attribute vec3 aCluster;
#endif
#ifdef TREE_PARTS
  uniform float uHeroGrow;
  attribute vec3 aPivot;
  attribute vec4 aGrow; // x start, y end, z min scale, w 1 = shrink instead of grow
#endif
float treeEaseOutBack(float t) {
  float u = t - 1.0;
  return 1.0 + 2.70158 * u * u * u + 1.70158 * u * u;
}
`;

const VERTEX_COLOR = /* glsl */ `
#include <color_vertex>
#ifdef TREE_INSTANCED
  float treeLum = dot(vColor.rgb, vec3(0.299, 0.587, 0.114));
  vColor.rgb = mix(vColor.rgb, aCluster * (0.45 + treeLum * 2.2), uCluster);
#endif
`;

const VERTEX_TRANSFORM = /* glsl */ `
#include <begin_vertex>
#ifdef TREE_INSTANCED
  float treeG = clamp((uGrow * 1.25 - aDelay) / 0.25, 0.0, 1.0);
  transformed.y *= treeEaseOutBack(treeG);
  transformed.xz *= treeEaseOutBack(clamp(treeG * 1.4 - 0.2, 0.0, 1.0));
#endif
#ifdef TREE_PARTS
  // whole tree scales from seedling size (0.14) to full, so it reads as alive at every stage;
  // each part also pops in around its own pivot on its own schedule
  float treeT = mix(0.14, 1.0, 1.0 - pow(1.0 - clamp(uHeroGrow / 0.7, 0.0, 1.0), 3.0));
  float treeG = clamp((uHeroGrow - aGrow.x) / max(aGrow.y - aGrow.x, 1e-4), 0.0, 1.0);
  float treeS = aGrow.w > 0.5 ? 1.0 - smoothstep(0.0, 1.0, treeG) : mix(aGrow.z, 1.0, treeEaseOutBack(treeG));
  transformed = (aPivot + (transformed - aPivot) * treeS) * treeT;
#endif
  // wind: sway grows with height, phase varies per tree
  vec3 treeOrigin = modelMatrix[3].xyz;
#ifdef USE_INSTANCING
  treeOrigin += instanceMatrix[3].xyz;
#endif
  float treeH = max(transformed.y - 0.5, 0.0);
  float treeSway = sin(uTime * 1.4 + treeOrigin.x * 0.35 + treeOrigin.z * 0.21) * 0.65 + sin(uTime * 2.3 + treeOrigin.z * 0.6) * 0.35;
  transformed.x += treeSway * uWind * treeH * treeH * 0.035;
  transformed.z += cos(uTime * 1.1 + treeOrigin.x * 0.27) * uWind * treeH * treeH * 0.02;
`;

/**
 * Flat-shaded foliage material with wind.
 * mode "static"    single mesh, wind only
 * mode "instanced" InstancedMesh with aDelay/aCluster attributes, driven by treeUniforms.uGrow / uCluster
 * mode "parts"     hero tree, each part grows around its own pivot, driven by extraUniforms.uHeroGrow
 */
export function createTreeMaterial(mode = 'static', extraUniforms = {}) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.85,
    metalness: 0,
  });
  if (mode === 'instanced') material.defines = { TREE_INSTANCED: '' };
  if (mode === 'parts') material.defines = { TREE_PARTS: '' };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, treeUniforms, extraUniforms); // same {value} objects, so tweens apply live
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEAD}`)
      .replace('#include <color_vertex>', VERTEX_COLOR)
      .replace('#include <begin_vertex>', VERTEX_TRANSFORM);
  };
  material.customProgramCacheKey = () => `treecord-tree-${mode}`;
  return material;
}
