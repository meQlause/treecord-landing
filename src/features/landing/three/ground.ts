import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { HEX } from '../../../shared/palette';
import { hash3, mulberry32, smoothstep } from '../../../shared/random';
import { paintFaces, type Painter } from './tree';

const GRASS_DARK = new THREE.Color(HEX.grassDark);
const GRASS_LIGHT = new THREE.Color(HEX.grassLight);
const DRY = new THREE.Color(HEX.dry);
const scratch = new THREE.Color();
const VEC3 = 3;

// three octaves of hills; flat around the origin, where the hero tree stands
const OCTAVES = [
  { scale: 0.016, shiftX: 0, shiftZ: 0, weight: 1 },
  { scale: 0.045, shiftX: 11, shiftZ: -7, weight: 0.35 },
  { scale: 0.11, shiftX: -3, shiftZ: 5, weight: 0.08 },
];
const HILLS = { height: 1.7, flatUntil: 4, fullAt: 16 };
const PAINT = {
  half: 0.5,
  hueScale: 0.03,
  hueShiftX: 40,
  hueShiftZ: -12,
  dryScale: 0.02,
  dryShiftX: -90,
  dryShiftZ: 30,
  dryFrom: 0.35,
  dryTo: 0.8,
  dryMix: 0.55,
  shadeBase: 0.94,
  shadeSpread: 0.12,
  salt: 3,
};

export interface Ground {
  mesh: THREE.Mesh;
  heightAt: (posX: number, posZ: number) => number;
  dispose: () => void;
}

const grassPainter =
  (noise: SimplexNoise): Painter =>
  (posX, posY, posZ) => {
    const hue = noise.noise(
      posX * PAINT.hueScale + PAINT.hueShiftX,
      posZ * PAINT.hueScale + PAINT.hueShiftZ,
    );
    const dry = noise.noise(
      posX * PAINT.dryScale + PAINT.dryShiftX,
      posZ * PAINT.dryScale + PAINT.dryShiftZ,
    );
    scratch.lerpColors(GRASS_DARK, GRASS_LIGHT, hue * PAINT.half + PAINT.half);
    scratch.lerp(DRY, smoothstep(PAINT.dryFrom, PAINT.dryTo, dry) * PAINT.dryMix);

    return scratch.multiplyScalar(
      PAINT.shadeBase + hash3(posX, posY, posZ, PAINT.salt) * PAINT.shadeSpread,
    );
  };

const terrain = (
  size: number,
  segments: number,
  heightAt: Ground['heightAt'],
): THREE.BufferGeometry => {
  const plane = new THREE.PlaneGeometry(size, size, segments, segments).rotateX(-Math.PI / 2);
  const position = plane.attributes.position;
  for (let index = 0; index < position.count; index += 1) {
    position.setY(index, heightAt(position.getX(index), position.getZ(index)));
  }
  const geometry = plane.toNonIndexed();
  plane.dispose();
  const colors = new Float32Array(geometry.attributes.position.count * VEC3);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, VEC3));

  return geometry;
};

/**
 * Low-poly rolling ground. Flat around the origin (where the hero tree stands), gentle hills further out.
 * `heightAt(x, z)` lets other assets sit on the surface.
 */
export function createGround({ seed = 3, size = 260, segments = 150 } = {}): Ground {
  const noise = new SimplexNoise({ random: mulberry32(seed) });
  const heightAt = (posX: number, posZ: number): number => {
    const hills = OCTAVES.reduce(
      (sum, octave) =>
        sum +
        noise.noise(posX * octave.scale + octave.shiftX, posZ * octave.scale + octave.shiftZ) *
          octave.weight,
      0,
    );

    return hills * HILLS.height * smoothstep(HILLS.flatUntil, HILLS.fullAt, Math.hypot(posX, posZ));
  };

  const geometry = terrain(size, segments, heightAt);
  paintFaces(geometry, grassPainter(noise));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ground';

  return {
    mesh,
    heightAt,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
