import * as THREE from 'three';
import { mulberry32, range } from './random.js';

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

/**
 * Carbon particles (B6): rise from the forest's crown tops and gather into a spinning coin above it.
 * carbon.uniforms.uProgress 0..1 drives the whole move (0 = invisible, 1 = token formed).
 * Call carbon.resize(viewportHeight, camera.fov, pixelRatio) on resize so point sizes stay in world units.
 */
export function createCarbon({
  seed = 5,
  count = 2400,
  sources,
  center = new THREE.Vector3(0, 16, -16),
  radius = 4.5,
} = {}) {
  const rng = mulberry32(seed);
  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const sourceCount = sources.length / 3;

  for (let i = 0; i < count; i++) {
    const s = Math.floor(rng() * sourceCount) * 3;
    start[i * 3] = sources[s] + range(rng, -0.3, 0.3);
    start[i * 3 + 1] = sources[s + 1] + range(rng, -0.2, 0.2);
    start[i * 3 + 2] = sources[s + 2] + range(rng, -0.3, 0.3);

    const angle = rng() * Math.PI * 2;
    // 62% on the rim, the rest filling the face: reads as a coin, i.e. one credit with one owner
    const r =
      i < count * 0.62 ? radius + range(rng, -0.18, 0.18) : Math.sqrt(rng()) * radius * 0.72;
    target[i * 3] = Math.cos(angle) * r;
    target[i * 3 + 1] = Math.sin(angle) * r;
    target[i * 3 + 2] = range(rng, -0.15, 0.15);

    rand.set([rng(), rng(), rng(), rng()], i * 4);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(start, 3)); // draw count only; the shader positions points
  geometry.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geometry.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

  const uniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: 0.28 },
    uScale: { value: 800 },
    uCenter: { value: center },
    uColorA: { value: new THREE.Color('#8CCB6E') },
    uColorB: { value: new THREE.Color('#1F5D3A') },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'carbon';
  points.frustumCulled = false; // positions are computed on the GPU
  // the coin is the subject of its beat: draw it over clouds and trees instead of letting them hide it
  material.depthTest = false;
  points.renderOrder = 10;

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
