import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HEX } from '../../../shared/palette';
import { hash3, mulberry32, type Bounds, type Rng, within } from '../../../shared/random';

const COLOR_KEYS = ['bark', 'barkLight', 'leafDark', 'leafMid', 'leafLight', 'sprout'] as const;

export const PALETTE = Object.fromEntries(
  COLOR_KEYS.map((key) => [key, new THREE.Color(HEX[key])]),
) as Record<(typeof COLOR_KEYS)[number], THREE.Color>;

const scratch = new THREE.Color();
const VEC3 = 3;
const VEC4 = 4;
const HALF = 0.5;
const FACE_SALT = 7;

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

interface PrepareOptions {
  pivot?: number[];
  grow?: number[];
}

/** Non-indexed copy with the attribute set every tree part shares, so parts can be merged. */
export function prepare(
  geometry: THREE.BufferGeometry,
  { pivot = [0, 0, 0], grow = [0, 0, 1, 0] }: PrepareOptions = {},
): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const count = flat.attributes.position.count;
  const filled = (size: number, values: number[]): THREE.Float32BufferAttribute =>
    new THREE.Float32BufferAttribute(
      new Float32Array(count * size).map((_item, index) => values[index % size]),
      size,
    );
  flat.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(new Float32Array(count * VEC3), VEC3),
  );
  flat.setAttribute('aPivot', filled(VEC3, pivot));
  flat.setAttribute('aGrow', filled(VEC4, grow));

  return flat;
}

/** Moves each vertex by a hash of its own position, so shared corners move together (no cracks). */
export function jitter(
  geometry: THREE.BufferGeometry,
  amount: number,
  salt = 0,
): THREE.BufferGeometry {
  const position = geometry.attributes.position;
  const reach = 2 * amount;
  for (let index = 0; index < position.count; index += 1) {
    const point: [number, number, number] = [
      position.getX(index),
      position.getY(index),
      position.getZ(index),
    ];
    position.setXYZ(
      index,
      point[0] + (hash3(...point, salt) - HALF) * reach,
      point[1] + (hash3(...point, salt + 1) - HALF) * reach,
      point[2] + (hash3(...point, salt + 2) - HALF) * reach,
    );
  }

  return geometry;
}

export type Painter = (posX: number, posY: number, posZ: number, shade: number) => THREE.Color;

const centroid = (
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  first: number,
): number[] => [
  (position.getX(first) + position.getX(first + 1) + position.getX(first + 2)) / VEC3,
  (position.getY(first) + position.getY(first + 1) + position.getY(first + 2)) / VEC3,
  (position.getZ(first) + position.getZ(first + 1) + position.getZ(first + 2)) / VEC3,
];

/** One colour per triangle (the low-poly mosaic look). */
export function paintFaces(geometry: THREE.BufferGeometry, paint: Painter): THREE.BufferGeometry {
  const position = geometry.attributes.position;
  const color = geometry.attributes.color;
  for (let first = 0; first < position.count; first += VEC3) {
    const [posX, posY, posZ] = centroid(position, first);
    const tint = paint(posX, posY, posZ, hash3(posX, posY, posZ, FACE_SALT));
    for (let corner = 0; corner < VEC3; corner += 1) {
      color.setXYZ(first + corner, tint.r, tint.g, tint.b);
    }
  }

  return geometry;
}

const CROWN = {
  ramp: 1.6,
  topStart: 0.55,
  topSpan: 0.45,
  topMix: 0.85,
  shadeBase: 0.88,
  shadeSpread: 0.24,
};
const BARK_MIX = 0.7;

/** Foliage gradient: dark underside (fake ambient occlusion), lighter sunlit top. */
export function crownColor(posY: number, low: number, high: number, shade: number): THREE.Color {
  const height = THREE.MathUtils.clamp((posY - low) / (high - low), 0, 1);
  scratch.lerpColors(PALETTE.leafDark, PALETTE.leafMid, Math.min(height * CROWN.ramp, 1));
  if (height > CROWN.topStart) {
    scratch.lerp(PALETTE.leafLight, ((height - CROWN.topStart) / CROWN.topSpan) * CROWN.topMix);
  }

  return scratch.multiplyScalar(CROWN.shadeBase + shade * CROWN.shadeSpread);
}

export const barkColor = (shade: number): THREE.Color =>
  scratch.lerpColors(PALETTE.bark, PALETTE.barkLight, shade * BARK_MIX);

export function finish(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

// ---------------------------------------------------------------- species

const bark: Painter = (_posX, _posY, _posZ, shade) => barkColor(shade);

const BLOB = {
  radius: { min: 0.5, max: 0.78 },
  spread: { min: 0.35, max: 0.6 },
  lift: { min: 0.3, max: 0.75 },
  firstLift: 0.85,
  squash: 0.82,
  jitterDetail: 0.12,
  jitterPlain: 0.08,
  seedStride: 31,
  crownBelow: 0.2,
  crownAbove: 1.7,
};

interface BlobInput {
  rng: Rng;
  seed: number;
  detail: number;
  trunkHeight: number;
  index: number;
  blobs: number;
}

function crownBlob({
  rng,
  seed,
  detail,
  trunkHeight,
  index,
  blobs,
}: BlobInput): THREE.BufferGeometry {
  const radius = within(rng, BLOB.radius);
  const angle = (index / blobs) * Math.PI * 2 + rng();
  const spread = index === 0 ? 0 : within(rng, BLOB.spread);
  const posY = trunkHeight + (index === 0 ? BLOB.firstLift : within(rng, BLOB.lift));
  const roughness = radius * (detail ? BLOB.jitterDetail : BLOB.jitterPlain);
  const blob = jitter(
    new THREE.IcosahedronGeometry(radius, detail),
    roughness,
    seed * BLOB.seedStride + index,
  )
    .scale(1, BLOB.squash, 1)
    .translate(Math.cos(angle) * spread, posY, Math.sin(angle) * spread);

  return paintFaces(prepare(blob), (_posX, centre, _posZ, shade) =>
    crownColor(centre, trunkHeight - BLOB.crownBelow, trunkHeight + BLOB.crownAbove, shade),
  );
}

const TRUNK = {
  top: 0.08,
  bottom: 0.15,
  sides: 6,
  segments: 2,
  jitter: 0.02,
  blobBase: 4,
  blobExtra: 2,
  intoCrown: 0.6, // the trunk runs up inside the first blob, whose underside floats 0.2 to 0.45 above the trunk's old top
};
const TRUNK_HEIGHT: Bounds = { min: 1.1, max: 1.5 };

/**
 * Tropical broadleaf (trembesi / mahogany silhouette): short trunk, clustered round crown. Base at y = 0.
 * detail 0 (20 faces per blob) for the forest, 1 (80 faces) for close-ups.
 */
export function createBroadleafGeometry(seed = 1, detail = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const trunkHeight = within(rng, TRUNK_HEIGHT);
  const blobs = TRUNK.blobBase + Math.floor(rng() * TRUNK.blobExtra);
  const length = trunkHeight + TRUNK.intoCrown;
  const cylinder = new THREE.CylinderGeometry(
    TRUNK.top,
    TRUNK.bottom,
    length,
    TRUNK.sides,
    TRUNK.segments,
  );
  const trunk = prepare(jitter(cylinder, TRUNK.jitter, seed).translate(0, length * HALF, 0));
  const parts = [paintFaces(trunk, bark)];
  for (let index = 0; index < blobs; index += 1) {
    parts.push(crownBlob({ rng, seed, detail, trunkHeight, index, blobs }));
  }

  return finish(parts);
}

const CONIFER = {
  trunkHeight: { min: 0.9, max: 1.2 } as Bounds,
  tierBase: 3,
  tierExtra: 2,
  trunkExtra: 0.6,
  trunkTop: 0.05,
  trunkBottom: 0.1,
  trunkSides: 5,
  trunkJitter: 0.015,
  baseShare: 0.7,
  radiusWide: 0.95,
  radiusNarrow: 0.38,
  radiusScale: { min: 0.9, max: 1.1 } as Bounds,
  height: { min: 0.95, max: 1.15 } as Bounds,
  taper: 0.1,
  step: 0.55,
  coneSides: 7,
  coneJitter: 0.08,
  seedStride: 17,
};

interface Tier {
  cone: THREE.BufferGeometry;
  top: number;
}

interface TierInput {
  rng: Rng;
  seed: number;
  index: number;
  tiers: number;
  base: number;
}

function coniferTier({ rng, seed, index, tiers, base }: TierInput): Tier {
  const ratio = index / (tiers - 1);
  const radius =
    THREE.MathUtils.lerp(CONIFER.radiusWide, CONIFER.radiusNarrow, ratio) *
    within(rng, CONIFER.radiusScale);
  const height = within(rng, CONIFER.height) * (1 - index * CONIFER.taper);
  const posY = base + index * CONIFER.step + height * HALF;
  const cone = jitter(
    new THREE.ConeGeometry(radius, height, CONIFER.coneSides, 1),
    radius * CONIFER.coneJitter,
    seed * CONIFER.seedStride + index,
  )
    .rotateY(rng() * Math.PI)
    .translate(0, posY, 0);

  return { cone, top: posY + height * HALF };
}

/** Tiered conifer (cemara / pine silhouette): thin trunk, 3 to 4 stacked cones. Base at y = 0. */
export function createConiferGeometry(seed = 1): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const trunkHeight = within(rng, CONIFER.trunkHeight);
  const tierCount = CONIFER.tierBase + Math.floor(rng() * CONIFER.tierExtra);
  const length = trunkHeight + CONIFER.trunkExtra;
  const cylinder = new THREE.CylinderGeometry(
    CONIFER.trunkTop,
    CONIFER.trunkBottom,
    length,
    CONIFER.trunkSides,
    2,
  );
  const trunk = prepare(jitter(cylinder, CONIFER.trunkJitter, seed).translate(0, length * HALF, 0));
  const base = trunkHeight * CONIFER.baseShare;
  const tiers = Array.from({ length: tierCount }, (_item, index) =>
    coniferTier({ rng, seed, index, tiers: tierCount, base }),
  );
  const top = tiers[tiers.length - 1].top; // painted once the full crown height is known
  const cones = tiers.map(({ cone }) =>
    paintFaces(prepare(cone), (_posX, posY, _posZ, shade) => crownColor(posY, base, top, shade)),
  );

  return finish([paintFaces(trunk, bark), ...cones]);
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

export type TreeMode = 'static' | 'instanced' | 'parts';

const DEFINES: Partial<Record<TreeMode, Record<string, string>>> = {
  instanced: { TREE_INSTANCED: '' },
  parts: { TREE_PARTS: '' },
};

/**
 * Flat-shaded foliage material with wind.
 * mode "static"    single mesh, wind only
 * mode "instanced" InstancedMesh with aDelay/aCluster attributes, driven by treeUniforms.uGrow / uCluster
 * mode "parts"     hero tree, each part grows around its own pivot, driven by extraUniforms.uHeroGrow
 */
export function createTreeMaterial(
  mode: TreeMode = 'static',
  extraUniforms: Record<string, THREE.IUniform> = {},
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.85,
    metalness: 0,
  });
  material.defines = DEFINES[mode] ?? material.defines;
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
