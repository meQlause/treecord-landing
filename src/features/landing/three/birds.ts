// A loose flock flying a slow loop over the forest. Dark silhouettes, wings flap in the vertex shader.
import * as THREE from 'three';
import { mulberry32, range, type Bounds } from './random';

const BIRD_FLAP = /* glsl */ `
#include <begin_vertex>
// wings are the vertices away from the body axis; they flap with a per-bird phase
transformed.y += abs(position.z) * sin(uTime * 9.0 + aPhase) * 0.55;
`;

const BODY = { nose: 0.7, tail: -0.5, thick: 0.06 };
const WING = { root: 0.25, tip: 0.05, span: 1.3 };
// body, then left wing, then right wing (z = span)
const SHAPE = [
  ...[BODY.nose, 0, 0, BODY.tail, BODY.thick, 0, BODY.tail, -BODY.thick, 0],
  ...[WING.root, 0, 0, -WING.root, 0, 0, -WING.tip, 0, WING.span],
  ...[WING.root, 0, 0, -WING.tip, 0, -WING.span, -WING.root, 0, 0],
];
const FORMATION = {
  row: -1.6,
  rowSide: 1.4,
  jitter: { min: -0.3, max: 0.3 } as Bounds,
  height: { min: -0.4, max: 0.4 } as Bounds,
};
const FLOCK = {
  radius: 70,
  rate: 0.045,
  squash: 0.55,
  behind: -40,
  altitude: 16,
  bob: 2,
  bobRate: 0.3,
  roll: 0.08,
  rollRate: 0.8,
  scale: 0.55,
  colour: '#2B3A33',
};
const VEC3 = 3;
const PAIR = 2;

type Offset = [number, number, number];

export interface Birds {
  group: THREE.InstancedMesh;
  update: (time: number) => void;
  dispose: () => void;
}

function formation(count: number, rng: () => number): Offset[] {
  return Array.from({ length: count }, (_item, index) => {
    const row = Math.ceil(index / PAIR);
    const side = index % PAIR ? 1 : -1;

    return [
      row * FORMATION.row + range(rng, FORMATION.jitter.min, FORMATION.jitter.max),
      range(rng, FORMATION.height.min, FORMATION.height.max),
      row * side * FORMATION.rowSide + range(rng, FORMATION.jitter.min, FORMATION.jitter.max),
    ];
  });
}

const HEAD = /* glsl */ `#include <common>
uniform float uTime;
attribute float aPhase;`;

function flapMaterial(time: THREE.IUniform<number>): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({ color: FLOCK.colour, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', HEAD)
      .replace('#include <begin_vertex>', BIRD_FLAP);
  };
  material.customProgramCacheKey = () => 'treecord-bird';

  return material;
}

export function createBirds({ seed = 41, count = 14 } = {}): Birds {
  const rng = mulberry32(seed);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(SHAPE, VEC3));
  geometry.computeVertexNormals();
  const phase = new Float32Array(count).map(() => rng() * Math.PI * 2);
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));

  const uniforms = { uTime: { value: 0 } };
  const material = flapMaterial(uniforms.uTime);

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.name = 'birds';
  const offsets = formation(count, rng); // V formation behind a leader
  const dummy = new THREE.Object3D();

  return {
    group: mesh,
    update(time) {
      uniforms.uTime.value = time;
      const angle = time * FLOCK.rate;
      const centreX = Math.cos(angle) * FLOCK.radius;
      const centreZ = Math.sin(angle) * FLOCK.radius * FLOCK.squash + FLOCK.behind;
      const heading = Math.atan2(Math.cos(angle) * FLOCK.squash, -Math.sin(angle)); // direction of travel in xz
      const centreY = FLOCK.altitude + Math.sin(time * FLOCK.bobRate) * FLOCK.bob;
      const [cosine, sine] = [Math.cos(-heading), Math.sin(-heading)];
      offsets.forEach(([offX, offY, offZ], index) => {
        dummy.position.set(
          centreX + offX * cosine - offZ * sine,
          centreY + offY,
          centreZ + offX * sine + offZ * cosine,
        );
        dummy.rotation.set(0, -heading, Math.sin(time * FLOCK.rollRate + index) * FLOCK.roll);
        dummy.scale.setScalar(FLOCK.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
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
