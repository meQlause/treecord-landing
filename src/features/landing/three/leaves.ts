// Leaves drifting down around the camera, in any beat.
import * as THREE from 'three';
import { mulberry32 } from './random';

const LEAF_VERTEX = /* glsl */ `
uniform float uTime;
uniform vec3 uCenter;
uniform vec3 uBox;
attribute vec4 aSeed;
varying vec3 vColor;
varying float vNear;
#include <fog_pars_vertex>

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }

void main() {
  // fall + sway + wind, then wrap into a box that travels with the camera: leaves are always around you
  vec3 p = aSeed.xyz * uBox;
  p.y -= uTime * (0.55 + aSeed.w * 0.7);
  p.x += uTime * 0.5 + sin(uTime * 0.8 + aSeed.w * 12.0) * 1.4;
  p.z += cos(uTime * 0.6 + aSeed.w * 9.0) * 1.0;
  vec3 rel = mod(p - uCenter + uBox * 0.5, uBox) - uBox * 0.5;

  float a = uTime * (0.8 + aSeed.w * 1.6) + aSeed.w * 6.2831;
  mat3 rot = rotY(a) * rotX(a * 0.7 + 0.6);
  vec3 local = rot * (position * (0.13 + aSeed.w * 0.1));
  vec3 n = rot * vec3(0.0, 1.0, 0.0);

  vec3 base = aSeed.w < 0.18 ? vec3(0.85, 0.66, 0.25) : mix(vec3(0.12, 0.42, 0.22), vec3(0.42, 0.68, 0.36), fract(aSeed.w * 7.0));
  vColor = base * (0.65 + 0.35 * abs(n.y));

  vec4 mvPosition = viewMatrix * vec4(uCenter + rel + local, 1.0);
  vNear = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const LEAF_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vNear;
#include <fog_pars_fragment>
void main() {
  // fade leaves that come too close to the lens instead of letting one fill the screen
  gl_FragColor = vec4(vColor, smoothstep(4.0, 9.0, vNear));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

const HALF_WIDTH = 0.45;
// a leaf: diamond, two triangles
const DIAMOND = [-1, 0, 0, 0, 0, HALF_WIDTH, 1, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, -HALF_WIDTH];
const BOX = { x: 36, y: 22, z: 36 };
const VEC3 = 3;
const VEC4 = 4;

export interface Leaves {
  group: THREE.Mesh;
  uniforms: Record<string, THREE.IUniform>;
  /** Set the wrap box's centre to the camera position. */
  update: (time: number, cameraPosition?: THREE.Vector3) => void;
  dispose: () => void;
}

export function createLeaves({ seed = 51, count = 150 } = {}): Leaves {
  const rng = mulberry32(seed);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(DIAMOND, VEC3));
  const instanced = new THREE.InstancedBufferGeometry().copy(
    geometry as THREE.InstancedBufferGeometry,
  );
  instanced.instanceCount = count;
  const seeds = new Float32Array(count * VEC4).map(() => rng());
  instanced.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, VEC4));

  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector3() },
        uBox: { value: new THREE.Vector3(BOX.x, BOX.y, BOX.z) },
      },
    ]),
    vertexShader: LEAF_VERTEX,
    fragmentShader: LEAF_FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  const mesh = new THREE.Mesh(instanced, material);
  mesh.frustumCulled = false;
  mesh.name = 'leaves';

  return {
    group: mesh,
    uniforms: material.uniforms,
    update(time, cameraPosition) {
      material.uniforms.uTime.value = time;
      if (cameraPosition) {
        material.uniforms.uCenter.value.copy(cameraPosition);
      }
    },
    dispose() {
      geometry.dispose();
      instanced.dispose();
      material.dispose();
    },
  };
}
