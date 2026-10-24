import * as THREE from 'three';
import { mulberry32, range, type Rng } from '../../../shared/random';

const vertexShader = /* glsl */ `
uniform float uProgress;
uniform float uTime;
uniform float uSize;
uniform float uScale;
uniform vec3 uCenter;
attribute vec3 aStart;
attribute vec3 aTarget;
attribute vec4 aRand; // x delay, y lift, z drift, w size
varying float vAlpha;
varying float vMix;

void main() {
  float t = clamp((uProgress - aRand.x * 0.45) / 0.55, 0.0, 1.0);
  float e = t * t * (3.0 - 2.0 * t);

  // the token spins slowly around its vertical axis once formed
  float a = uTime * 0.35;
  vec3 rel = aTarget;
  rel.xz = mat2(cos(a), sin(a), -sin(a), cos(a)) * rel.xz;

  vec3 p = mix(aStart, uCenter + rel, e);
  float arc = sin(e * 3.14159);
  p.y += arc * (2.0 + aRand.y * 6.0);
  p.x += arc * (aRand.z - 0.5) * 6.0;
  p.y += sin(uTime * 1.7 + aRand.y * 6.2831) * 0.08 * e;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aRand.w * 0.8) * uScale / -mv.z;
  vAlpha = smoothstep(0.0, 0.12, t);
  vMix = e;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vAlpha;
varying float vMix;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.15, d) * vAlpha;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(mix(uColorA, uColorB, vMix), alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const VEC3 = 3;
const VEC4 = 4;
const TAU = Math.PI * 2;
// 62% of the particles sit on the rim, the rest fill the face: reads as a coin, i.e. one credit with one owner
const COIN = { rimShare: 0.62, rimJitter: 0.18, faceReach: 0.72, depth: 0.15 };
const SPAWN = { sideways: 0.3, upright: 0.2 };
const CENTRE = { x: 0, y: 16, z: -16 };
const LOOK = { size: 0.28, scale: 800, from: '#8CCB6E', to: '#1F5D3A', order: 10 };

export interface CarbonOptions {
  seed?: number;
  count?: number;
  /** Crown-top positions (x, y, z) the particles rise from. */
  sources: ArrayLike<number>;
  center?: THREE.Vector3;
  radius?: number;
}

export interface Carbon {
  points: THREE.Points;
  uniforms: Record<string, THREE.IUniform>;
  resize: (viewportHeight: number, fov: number, pixelRatio: number) => void;
  dispose: () => void;
}

interface Buffers {
  start: Float32Array;
  target: Float32Array;
  rand: Float32Array;
}

interface Seeding {
  rng: Rng;
  buffers: Buffers;
  sources: ArrayLike<number>;
  radius: number;
  onRim: boolean;
}

function seedParticle({ rng, buffers, sources, radius, onRim }: Seeding, index: number): void {
  const { start, target, rand } = buffers;
  const source = Math.floor(rng() * (sources.length / VEC3)) * VEC3;
  start[index * VEC3] = sources[source] + range(rng, -SPAWN.sideways, SPAWN.sideways);
  start[index * VEC3 + 1] = sources[source + 1] + range(rng, -SPAWN.upright, SPAWN.upright);
  start[index * VEC3 + 2] = sources[source + 2] + range(rng, -SPAWN.sideways, SPAWN.sideways);

  const angle = rng() * TAU;
  const reach = onRim
    ? radius + range(rng, -COIN.rimJitter, COIN.rimJitter)
    : Math.sqrt(rng()) * radius * COIN.faceReach;
  target[index * VEC3] = Math.cos(angle) * reach;
  target[index * VEC3 + 1] = Math.sin(angle) * reach;
  target[index * VEC3 + 2] = range(rng, -COIN.depth, COIN.depth);

  rand.set([rng(), rng(), rng(), rng()], index * VEC4);
}

function seedBuffers(options: Seeding & { count: number }): Buffers {
  const { count, ...seeding } = options;
  for (let index = 0; index < count; index += 1) {
    seedParticle({ ...seeding, onRim: index < count * COIN.rimShare }, index);
  }

  return seeding.buffers;
}

function particleGeometry(buffers: Buffers): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(buffers.start, VEC3)); // draw count only; the shader positions points
  geometry.setAttribute('aStart', new THREE.BufferAttribute(buffers.start, VEC3));
  geometry.setAttribute('aTarget', new THREE.BufferAttribute(buffers.target, VEC3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(buffers.rand, VEC4));

  return geometry;
}

/**
 * Carbon particles (B6): rise from the forest's crown tops and gather into a spinning coin above it.
 * carbon.uniforms.uProgress 0..1 drives the whole move (0 = invisible, 1 = token formed).
 * Call carbon.resize(viewportHeight, camera.fov, pixelRatio) on resize so point sizes stay in world units.
 */
export function createCarbon({
  seed = 5,
  count = 2400,
  sources,
  center = new THREE.Vector3(CENTRE.x, CENTRE.y, CENTRE.z),
  radius = 4.5,
}: CarbonOptions): Carbon {
  const empty = {
    start: new Float32Array(count * VEC3),
    target: new Float32Array(count * VEC3),
    rand: new Float32Array(count * VEC4),
  };
  const buffers = seedBuffers({
    count,
    rng: mulberry32(seed),
    buffers: empty,
    sources,
    radius,
    onRim: false,
  });
  const geometry = particleGeometry(buffers);

  const uniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: LOOK.size },
    uScale: { value: LOOK.scale },
    uCenter: { value: center },
    uColorA: { value: new THREE.Color(LOOK.from) },
    uColorB: { value: new THREE.Color(LOOK.to) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });
  // the coin is the subject of its beat: draw it over clouds and trees instead of letting them hide it
  material.depthTest = false;

  const points = new THREE.Points(geometry, material);
  points.name = 'carbon';
  points.frustumCulled = false; // positions are computed on the GPU
  points.renderOrder = LOOK.order;

  return {
    points,
    uniforms,
    resize(viewportHeight, fov, pixelRatio) {
      uniforms.uScale.value =
        (viewportHeight * pixelRatio) / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
