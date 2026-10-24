// Three ridges on the horizon, the middle one with a volcano cone (a nod to Indonesia's skyline).
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { HEX } from '../../../shared/palette';
import { hash3, mulberry32, smoothstep } from '../../../shared/random';

interface Volcano {
  x: number;
  h: number;
  w: number;
}

interface Layer {
  z: number;
  height: number;
  base: string;
  mix: number;
  volcano: Volcano | null;
}

const LAYERS: Layer[] = [
  { z: -330, height: 34, base: '#8FAE9C', mix: 0.62, volcano: null },
  { z: -260, height: 24, base: '#6E9A80', mix: 0.5, volcano: { x: 60, h: 50, w: 70 } },
  { z: -195, height: 15, base: '#56866A', mix: 0.4, volcano: null },
];
const RIDGE = {
  reach: 420,
  step: 14,
  broadScale: 0.006,
  layerShift: 10,
  broadShare: 0.5,
  detailScale: 0.03,
  detailShift: 5,
  detailShare: 0.12,
  coneCurve: 1.15,
  craterShare: 0.88,
};
const FACE = {
  foot: -10,
  midDepth: 0.45,
  sunBase: 0.5,
  sunSlope: 0.9,
  sunShare: 0.8,
  noiseShare: 0.2,
  left: 0.6,
  right: 0.75,
  under: 0.5,
  lightMix: 0.35,
  hazeFrom: -10,
  hazeTo: 0.8,
  hazeCurve: 0.7,
};
const WHITE = '#FFFFFF';
const VEC3 = 3;

const mist = new THREE.Color();
const scratch = new THREE.Color();

type Point = [number, number, number];

interface Paint {
  base: THREE.Color;
  light: THREE.Color;
  background: THREE.Color;
  height: number;
}

interface Soup {
  positions: number[];
  colors: number[];
}

function ridgeHeight(noise: SimplexNoise, layer: Layer, index: number, posX: number): number {
  const broad =
    (noise.noise(posX * RIDGE.broadScale + index * RIDGE.layerShift, index) * RIDGE.broadShare +
      RIDGE.broadShare) *
    layer.height;
  const detail =
    noise.noise(posX * RIDGE.detailScale, index + RIDGE.detailShift) *
    layer.height *
    RIDGE.detailShare;
  const { volcano } = layer;
  if (!volcano) {
    return broad + detail;
  }
  const cone =
    volcano.h * Math.max(0, 1 - Math.abs(posX - volcano.x) / volcano.w) ** RIDGE.coneCurve;

  return Math.max(
    broad + detail,
    cone > volcano.h * RIDGE.craterShare ? volcano.h * RIDGE.craterShare : cone,
  ); // flat crater top
}

/** Fades each ridge into the haze toward its foot: it rises out of mist instead of ending on a hard edge. */
function pushFace(soup: Soup, paint: Paint, corners: Point[], tone: number): void {
  const colour = scratch.copy(paint.base).lerp(paint.light, tone);
  for (const corner of corners) {
    const haze = smoothstep(FACE.hazeFrom, paint.height * FACE.hazeTo, corner[1]) ** FACE.hazeCurve;
    mist.copy(paint.background).lerp(colour, haze);
    soup.positions.push(...corner);
    soup.colors.push(mist.r, mist.g, mist.b);
  }
}

function pushSegment(
  soup: Soup,
  paint: Paint,
  ends: { left: number[]; right: number[]; z: number; index: number },
): void {
  const [leftX, leftY] = ends.left;
  const [rightX, rightY] = ends.right;
  const { z, index } = ends;
  const middle: Point = [(leftX + rightX) / 2, Math.min(leftY, rightY) * FACE.midDepth, z];
  // slopes facing the sun (rising to the right) are lighter
  const slope = Math.atan2(rightY - leftY, rightX - leftX);
  const tone =
    Math.min(Math.max(FACE.sunBase + slope * FACE.sunSlope, 0), 1) * FACE.sunShare +
    hash3(leftX, leftY, index) * FACE.noiseShare;
  pushFace(soup, paint, [[leftX, leftY, z], middle, [rightX, rightY, z]], tone);
  pushFace(soup, paint, [[leftX, leftY, z], [leftX, FACE.foot, z], middle], tone * FACE.left);
  pushFace(soup, paint, [middle, [rightX, FACE.foot, z], [rightX, rightY, z]], tone * FACE.right);
  pushFace(soup, paint, [[leftX, FACE.foot, z], [rightX, FACE.foot, z], middle], tone * FACE.under);
}

function layerGeometry(
  noise: SimplexNoise,
  layer: Layer,
  index: number,
  background: THREE.Color,
): THREE.BufferGeometry {
  const count = (RIDGE.reach * 2) / RIDGE.step + 1;
  const top = Array.from({ length: count }, (_item, step) => {
    const posX = -RIDGE.reach + step * RIDGE.step;

    return [posX, ridgeHeight(noise, layer, index, posX)];
  });
  const base = new THREE.Color(layer.base).lerp(background, layer.mix);
  const paint: Paint = {
    base,
    light: base.clone().lerp(new THREE.Color(WHITE), FACE.lightMix),
    background,
    height: layer.height,
  };
  const soup: Soup = { positions: [], colors: [] };
  for (let segment = 0; segment < top.length - 1; segment += 1) {
    pushSegment(soup, paint, { left: top[segment], right: top[segment + 1], z: layer.z, index });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(soup.positions, VEC3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(soup.colors, VEC3));
  geometry.computeBoundingSphere();

  return geometry;
}

export interface Mountains {
  group: THREE.Group;
  update: () => void;
  dispose: () => void;
}

/**
 * Unlit and fog-free with colours already mixed toward the paper background, so they stay
 * as soft, readable layers even when the fog swallows the forest.
 */
export function createMountains({ seed = 31 } = {}): Mountains {
  const noise = new SimplexNoise({ random: mulberry32(seed) });
  const background = new THREE.Color(HEX.bg);
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    fog: false,
    side: THREE.DoubleSide,
  });
  const group = new THREE.Group();
  group.name = 'mountains';
  const geometries = LAYERS.map((layer, index) => layerGeometry(noise, layer, index, background));
  geometries.forEach((geometry) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = -1;
    group.add(mesh);
  });

  return {
    group,
    update() {
      // static: the ridges never move
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
    },
  };
}
