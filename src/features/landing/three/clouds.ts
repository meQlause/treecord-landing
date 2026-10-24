// Low-poly clouds for the stage. Same palette, flat shading and light direction as the forest.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, range, smoothstep, within, type Bounds } from '../../../shared/random';
import { jitter, paintFaces } from './tree';

const CLOUD_LOW = new THREE.Color('#E6E4DC');
const CLOUD_HIGH = new THREE.Color('#FFFFFF');
const scratch = new THREE.Color();
const VEC3 = 3;
const HALF = 0.5;

const PUFF = {
  base: 4,
  extra: 3,
  radius: { min: 1.2, max: 2.4 } as Bounds,
  grow: 0.6,
  detailJitter: 0.1,
  seedStride: 7,
  squashY: 0.62,
  squashZ: 0.8,
  spacing: { min: 1.3, max: 1.7 } as Bounds,
  lift: 0.2,
  depth: { min: -0.6, max: 0.6 } as Bounds,
  shadeFrom: -1,
  shadeTo: 1.2,
  shadeHeight: 0.85,
  shadeNoise: 0.15,
};
const DRIFT = {
  scale: { min: 1.2, max: 3.2 } as Bounds,
  speed: { min: 0.4, max: 1.1 } as Bounds,
  glow: 0.62,
  hidden: 0.01,
};

/** One cloud: 4 to 6 squashed, jittered icosahedrons merged, light on top, cool grey underneath. */
function cloudGeometry(seed: number): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const puffs = PUFF.base + Math.floor(rng() * PUFF.extra);
  const middle = (puffs - 1) * HALF;
  const parts = Array.from({ length: puffs }, (_item, index) => {
    const radius = within(rng, PUFF.radius) * (1 - Math.abs(index - middle) / puffs);
    const drift = (index - middle) * within(rng, PUFF.spacing);
    const geometry = jitter(
      new THREE.IcosahedronGeometry(radius + PUFF.grow, 1),
      radius * PUFF.detailJitter,
      seed * PUFF.seedStride + index,
    )
      .scale(1, PUFF.squashY, PUFF.squashZ)
      .translate(drift, radius * PUFF.lift, within(rng, PUFF.depth));
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(
        new Float32Array(geometry.attributes.position.count * VEC3),
        VEC3,
      ),
    );

    return paintFaces(geometry, (_posX, posY, _posZ, shade) =>
      scratch.lerpColors(
        CLOUD_LOW,
        CLOUD_HIGH,
        smoothstep(PUFF.shadeFrom, PUFF.shadeTo, posY) * PUFF.shadeHeight + shade * PUFF.shadeNoise,
      ),
    );
  });
  const geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  geometry.computeVertexNormals();

  return geometry;
}

export interface CloudOptions {
  seed?: number;
  count?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  minZ?: number;
  maxZ?: number;
}

const DEFAULTS = {
  seed: 21,
  count: 30,
  minX: -140,
  maxX: 160,
  minY: 21,
  maxY: 42,
  minZ: -170,
  maxZ: 50,
};

export interface Clouds {
  group: THREE.Group;
  /** 0..1; a beat thins the clouds when something behind them must read (the carbon coin) */
  opacity: number;
  update: (time: number) => void;
  dispose: () => void;
}

/**
 * Clouds drifting along +x and wrapping, in a band around the height the 2D beats fly at,
 * so the camera passes through them and gets real parallax.
 */
export function createClouds(options: CloudOptions = {}): Clouds {
  const { seed, count, minX, maxX, minY, maxY, minZ, maxZ } = { ...DEFAULTS, ...options };
  const rng = mulberry32(seed);
  const variants = [cloudGeometry(seed), cloudGeometry(seed + 1), cloudGeometry(seed + 2)];
  // fog: false so the 2D beats (fog pulled in) still fly through real clouds instead of paper-coloured holes
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    emissive: '#FFFFFF',
    emissiveIntensity: DRIFT.glow,
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
      scale: within(rng, DRIFT.scale),
      speed: within(rng, DRIFT.speed),
      turn: rng() * Math.PI,
    }));
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
    mesh.frustumCulled = false; // instances move every frame
    group.add(mesh);

    return { mesh, items };
  });

  return {
    group,
    get opacity() {
      return material.opacity;
    },
    set opacity(value: number) {
      material.opacity = value;
      group.visible = value > DRIFT.hidden;
    },
    update(time) {
      for (const { mesh, items } of meshes) {
        items.forEach((cloud, index) => {
          dummy.position.set(
            minX + ((((cloud.x - minX + time * cloud.speed) % span) + span) % span),
            cloud.y,
            cloud.z,
          );
          dummy.rotation.set(0, cloud.turn, 0);
          dummy.scale.set(cloud.scale, cloud.scale, cloud.scale);
          dummy.updateMatrix();
          mesh.setMatrixAt(index, dummy.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() {
      meshes.forEach(({ mesh }) => mesh.dispose());
      variants.forEach((geometry) => geometry.dispose());
      material.dispose();
    },
  };
}
