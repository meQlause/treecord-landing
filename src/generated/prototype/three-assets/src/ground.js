import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mulberry32, smoothstep, hash3 } from './random.js';
import { paintFaces } from './tree.js';
import { HEX } from './palette.js';

const GRASS_DARK = new THREE.Color(HEX.grassDark);
const GRASS_LIGHT = new THREE.Color(HEX.grassLight);
const DRY = new THREE.Color(HEX.dry);
const tmp = new THREE.Color();

/**
 * Low-poly rolling ground. Flat around the origin (where the hero tree stands),
 * gentle hills further out. `heightAt(x, z)` lets other assets sit on the surface.
 */
export function createGround({ seed = 3, size = 260, segments = 150 } = {}) {
  const noise = new SimplexNoise({ random: mulberry32(seed) });

  const heightAt = (x, z) => {
    const n =
      noise.noise(x * 0.016, z * 0.016) +
      noise.noise(x * 0.045 + 11, z * 0.045 - 7) * 0.35 +
      noise.noise(x * 0.11 - 3, z * 0.11 + 5) * 0.08;
    return n * 1.7 * smoothstep(4, 16, Math.hypot(x, z));
  };

  const plane = new THREE.PlaneGeometry(size, size, segments, segments).rotateX(-Math.PI / 2);
  const p = plane.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)));

  const geometry = plane.toNonIndexed();
  plane.dispose();
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3),
  );
  paintFaces(geometry, (x, y, z, h) => {
    tmp.lerpColors(GRASS_DARK, GRASS_LIGHT, noise.noise(x * 0.03 + 40, z * 0.03 - 12) * 0.5 + 0.5);
    tmp.lerp(DRY, smoothstep(0.35, 0.8, noise.noise(x * 0.02 - 90, z * 0.02 + 30)) * 0.55);
    return tmp.multiplyScalar(0.94 + hash3(x, y, z, 3) * 0.12);
  });
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
