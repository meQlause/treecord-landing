// Sky life for the stage: low-poly clouds, distant volcano ridges, a flock of birds, and falling leaves.
// Same palette, flat shading and light direction as the forest. Each asset has update(t) and dispose().
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mulberry32, range, hash3, smoothstep } from './random.js';
import { jitter, paintFaces } from './tree.js';
import { HEX } from './palette.js';

const tmp = new THREE.Color();

// ---------------------------------------------------------------- clouds
const CLOUD_LOW = new THREE.Color('#E6E4DC');
const CLOUD_HIGH = new THREE.Color('#FFFFFF');

/** One cloud: 4 to 6 squashed, jittered icosahedrons merged, light on top, cool grey underneath. */
function cloudGeometry(seed) {
  const rng = mulberry32(seed);
  const n = 4 + Math.floor(rng() * 3);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const r = range(rng, 1.2, 2.4) * (1 - Math.abs(i - (n - 1) / 2) / n);
    const g = jitter(new THREE.IcosahedronGeometry(r + 0.6, 1), r * 0.1, seed * 7 + i)
      .scale(1, 0.62, 0.8)
      .translate((i - (n - 1) / 2) * range(rng, 1.3, 1.7), r * 0.2, range(rng, -0.6, 0.6));
    g.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3),
    );
    parts.push(
      paintFaces(g, (x, y, z, h) =>
        tmp.lerpColors(CLOUD_LOW, CLOUD_HIGH, smoothstep(-1, 1.2, y) * 0.85 + h * 0.15),
      ),
    );
  }
  const geometry = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Clouds drifting along +x and wrapping, in a band around the height the 2D beats fly at,
 * so the camera passes through them and gets real parallax.
 */
export function createClouds({
  seed = 21,
  count = 30,
  minX = -140,
  maxX = 160,
  minY = 21,
  maxY = 42,
  minZ = -170,
  maxZ = 50,
} = {}) {
  const rng = mulberry32(seed);
  const variants = [cloudGeometry(seed), cloudGeometry(seed + 1), cloudGeometry(seed + 2)];
  // fog: false so the 2D beats (fog pulled in) still fly through real clouds instead of paper-coloured holes
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    emissive: '#FFFFFF',
    emissiveIntensity: 0.62,
    fog: false,
    transparent: true,
  });
  const group = new THREE.Group();
  group.name = 'clouds';
  const span = maxX - minX;
  const dummy = new THREE.Object3D();

  const meshes = variants.map((geometry) => {
    const items = Array.from({ length: Math.ceil(count / variants.length) }, () => ({
      x: range(rng, minX, maxX),
      y: range(rng, minY, maxY),
      z: range(rng, minZ, maxZ),
      s: range(rng, 1.2, 3.2),
      speed: range(rng, 0.4, 1.1),
      rot: rng() * Math.PI,
    }));
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
    mesh.frustumCulled = false; // instances move every frame
    group.add(mesh);
    return { mesh, items };
  });

  return {
    group,
    /** 0..1; a beat thins the clouds when something behind them must read (the carbon coin) */
    set opacity(v) {
      material.opacity = v;
      group.visible = v > 0.01;
    },
    update(t) {
      for (const { mesh, items } of meshes) {
        items.forEach((c, i) => {
          dummy.position.set(
            minX + ((((c.x - minX + t * c.speed) % span) + span) % span),
            c.y,
            c.z,
          );
          dummy.rotation.set(0, c.rot, 0);
          dummy.scale.set(c.s, c.s, c.s);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      meshes.forEach(({ mesh }) => mesh.dispose());
      variants.forEach((g) => g.dispose());
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------- mountains
/**
 * Three ridges on the horizon, the middle one with a volcano cone (a nod to Indonesia's skyline).
 * Unlit and fog-free with colours already mixed toward the paper background, so they stay
 * as soft, readable layers even when the fog swallows the forest.
 */
export function createMountains({ seed = 31 } = {}) {
  const noise = new SimplexNoise({ random: mulberry32(seed) });
  const bg = new THREE.Color(HEX.bg);
  const layers = [
    { z: -330, height: 34, base: '#8FAE9C', mix: 0.62, volcano: null },
    { z: -260, height: 24, base: '#6E9A80', mix: 0.5, volcano: { x: 60, h: 50, w: 70 } },
    { z: -195, height: 15, base: '#56866A', mix: 0.4, volcano: null },
  ];
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    fog: false,
    side: THREE.DoubleSide,
  });
  const mist = new THREE.Color();
  const group = new THREE.Group();
  group.name = 'mountains';
  const geometries = [];

  layers.forEach((L, li) => {
    const top = [];
    for (let x = -420; x <= 420; x += 14) {
      let y =
        (noise.noise(x * 0.006 + li * 10, li) * 0.5 + 0.5) * L.height +
        noise.noise(x * 0.03, li + 5) * L.height * 0.12;
      if (L.volcano) {
        const d = Math.abs(x - L.volcano.x) / L.volcano.w;
        const cone = L.volcano.h * Math.max(0, 1 - d) ** 1.15;
        y = Math.max(y, cone > L.volcano.h * 0.88 ? L.volcano.h * 0.88 : cone); // flat crater top
      }
      top.push([x, y]);
    }
    const positions = [];
    const colors = [];
    const baseColor = new THREE.Color(L.base).lerp(bg, L.mix);
    const lightColor = baseColor.clone().lerp(new THREE.Color('#FFFFFF'), 0.35);
    const face = (a, b, c, k) => {
      positions.push(...a, ...b, ...c);
      const col = tmp.copy(baseColor).lerp(lightColor, k);
      // fade each ridge into the haze toward its foot: it rises out of mist instead of ending on a hard edge
      for (const [, y] of [a, b, c]) {
        const v = mist.copy(bg).lerp(col, smoothstep(-10, L.height * 0.8, y) ** 0.7);
        colors.push(v.r, v.g, v.b);
      }
    };
    for (let i = 0; i < top.length - 1; i++) {
      const [x0, y0] = top[i];
      const [x1, y1] = top[i + 1];
      const mid = [(x0 + x1) / 2, Math.min(y0, y1) * 0.45, L.z];
      // slopes facing the sun (rising to the right) are lighter
      const slope = Math.atan2(y1 - y0, x1 - x0);
      const k = Math.min(Math.max(0.5 + slope * 0.9, 0), 1) * 0.8 + hash3(x0, y0, li) * 0.2;
      face([x0, y0, L.z], mid, [x1, y1, L.z], k);
      face([x0, y0, L.z], [x0, -10, L.z], mid, k * 0.6);
      face(mid, [x1, -10, L.z], [x1, y1, L.z], k * 0.75);
      face([x0, -10, L.z], [x1, -10, L.z], mid, k * 0.5);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeBoundingSphere();
    geometries.push(g);
    const mesh = new THREE.Mesh(g, material);
    mesh.renderOrder = -1;
    group.add(mesh);
  });

  return {
    group,
    update() {},
    dispose() {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------- birds
const BIRD_FLAP = /* glsl */ `
#include <begin_vertex>
// wings are the vertices away from the body axis; they flap with a per-bird phase
transformed.y += abs(position.z) * sin(uTime * 9.0 + aPhase) * 0.55;
`;

/** A loose flock flying a slow loop over the forest. Dark silhouettes, wings flap in the vertex shader. */
export function createBirds({ seed = 41, count = 14 } = {}) {
  const rng = mulberry32(seed);
  const positions = [
    // body
    0.7, 0, 0, -0.5, 0.06, 0, -0.5, -0.06, 0,
    // left wing, right wing (z = span)
    0.25, 0, 0, -0.25, 0, 0, -0.05, 0, 1.3, 0.25, 0, 0, -0.05, 0, -1.3, -0.25, 0, 0,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const phase = new Float32Array(count).map(() => rng() * Math.PI * 2);
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));

  const uniforms = { uTime: { value: 0 } };
  const material = new THREE.MeshBasicMaterial({ color: '#2B3A33', side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uTime;\nattribute float aPhase;',
      )
      .replace('#include <begin_vertex>', BIRD_FLAP);
  };
  material.customProgramCacheKey = () => 'treecord-bird';

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.name = 'birds';
  // V formation offsets behind a leader
  const offsets = Array.from({ length: count }, (_, i) => {
    const row = Math.ceil(i / 2);
    const side = i % 2 ? 1 : -1;
    return [
      -row * 1.6 + range(rng, -0.3, 0.3),
      range(rng, -0.4, 0.4),
      row * side * 1.4 + range(rng, -0.3, 0.3),
    ];
  });
  const dummy = new THREE.Object3D();
  const R = 70;

  return {
    group: mesh,
    update(t) {
      uniforms.uTime.value = t;
      const a = t * 0.045;
      const cx = Math.cos(a) * R;
      const cz = Math.sin(a) * R * 0.55 - 40;
      const heading = Math.atan2(Math.cos(a) * 0.55, -Math.sin(a)); // direction of travel in xz
      const cy = 16 + Math.sin(t * 0.3) * 2;
      offsets.forEach(([ox, oy, oz], i) => {
        const c = Math.cos(-heading);
        const s = Math.sin(-heading);
        dummy.position.set(cx + ox * c - oz * s, cy + oy, cz + ox * s + oz * c);
        dummy.rotation.set(0, -heading, Math.sin(t * 0.8 + i) * 0.08);
        dummy.scale.setScalar(0.55);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}

// ---------------------------------------------------------------- leaves
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

/** Leaves drifting down around the camera, in any beat. Set leaves.uniforms.uCenter to the camera position. */
export function createLeaves({ seed = 51, count = 150 } = {}) {
  const rng = mulberry32(seed);
  const geometry = new THREE.BufferGeometry();
  // a leaf: diamond, two triangles
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-1, 0, 0, 0, 0, 0.45, 1, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, -0.45],
      3,
    ),
  );
  const instanced = new THREE.InstancedBufferGeometry().copy(geometry);
  instanced.instanceCount = count;
  instanced.setAttribute(
    'aSeed',
    new THREE.InstancedBufferAttribute(
      new Float32Array(count * 4).map(() => rng()),
      4,
    ),
  );

  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector3() },
        uBox: { value: new THREE.Vector3(36, 22, 36) },
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
    update(t, cameraPosition) {
      material.uniforms.uTime.value = t;
      if (cameraPosition) material.uniforms.uCenter.value.copy(cameraPosition);
    },
    dispose() {
      geometry.dispose();
      instanced.dispose();
      material.dispose();
    },
  };
}
