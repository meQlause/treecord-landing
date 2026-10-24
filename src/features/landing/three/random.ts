// Pure helpers (no three.js import): the same seed always gives the same forest.
export type Rng = () => number;

export interface Bounds {
  min: number;
  max: number;
}

export interface Clearing {
  x: number;
  z: number;
  r: number;
}

const INCREMENT = 0x6d2b79f5;
const UINT32 = 4294967296;
const MIX = { first: 15, second: 7, third: 61, last: 14 };
const SMOOTH = 3;
const HASH = { x: 0.1271, y: 0.3117, z: 0.0747, salt: 19.19, scale: 43758.5453, grid: 1000 };
const NEIGHBOURS = 2;
const ATTEMPTS_PER_POINT = 40;

/** Seeded PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;

  return () => {
    state = (state + INCREMENT) >>> 0;
    let mixed = Math.imul(state ^ (state >>> MIX.first), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> MIX.second), mixed | MIX.third);

    return ((mixed ^ (mixed >>> MIX.last)) >>> 0) / UINT32;
  };
}

export const range = (rng: Rng, min: number, max: number): number => min + (max - min) * rng();

export const within = (rng: Rng, bounds: Bounds): number => range(rng, bounds.min, bounds.max);

export const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const ratio = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);

  return ratio * ratio * (SMOOTH - 2 * ratio);
};

/**
 * Deterministic hash of a position, in [0, 1). Inputs are quantised to 1 mm so vertices that sit on the
 * same spot (seams, shared corners) always get the same value, which keeps jittered meshes watertight.
 */
export function hash3(posX: number, posY: number, posZ: number, salt = 0): number {
  const grid = (value: number): number => Math.round(value * HASH.grid);
  const sum = grid(posX) * HASH.x + grid(posY) * HASH.y + grid(posZ) * HASH.z + salt * HASH.salt;
  const scaled = Math.sin(sum) * HASH.scale;

  return scaled - Math.floor(scaled);
}

export interface ScatterOptions {
  count: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minDist: number;
  clearings?: Clearing[];
  rng: Rng;
  maxAttempts?: number;
}

interface Grid {
  cell: number;
  cols: number;
  rows: number;
  slots: Int32Array;
}

const span = (centre: number, limit: number): number[] => {
  const first = Math.max(0, centre - NEIGHBOURS);
  const last = Math.min(limit - 1, centre + NEIGHBOURS);

  return Array.from({ length: Math.max(last - first + 1, 0) }, (_item, offset) => first + offset);
};

function crowded(
  grid: Grid,
  points: number[][],
  where: { col: number; row: number },
  near: number[],
): boolean {
  const [posX, posZ, minDist] = near;

  return span(where.row, grid.rows).some((row) =>
    span(where.col, grid.cols).some((col) => {
      const other = grid.slots[row * grid.cols + col];

      return other >= 0 && Math.hypot(points[other][0] - posX, points[other][1] - posZ) < minDist;
    }),
  );
}

function throwDart(options: ScatterOptions, grid: Grid, points: number[][]): void {
  const { minX, maxX, minZ, maxZ, minDist, clearings = [], rng } = options;
  const posX = range(rng, minX, maxX);
  const posZ = range(rng, minZ, maxZ);
  const where = {
    col: Math.floor((posX - minX) / grid.cell),
    row: Math.floor((posZ - minZ) / grid.cell),
  };
  const blocked = clearings.some((spot) => Math.hypot(posX - spot.x, posZ - spot.z) < spot.r);
  if (blocked || crowded(grid, points, where, [posX, posZ, minDist])) {
    return;
  }
  grid.slots[where.row * grid.cols + where.col] = points.length;
  points.push([posX, posZ]);
}

/**
 * Random points on a rectangle with a minimum spacing (dart throwing on a grid).
 * Returns [[x, z], ...]. Stops at `count` points or after `maxAttempts` darts.
 * ponytail: dart throwing saturates near ~50% coverage; switch to Bridson Poisson-disk sampling if a much
 * denser forest is ever needed.
 */
export function scatter(options: ScatterOptions): number[][] {
  const { count, minX, maxX, minZ, maxZ, minDist } = options;
  const { maxAttempts = count * ATTEMPTS_PER_POINT } = options;
  const cell = minDist / Math.SQRT2; // a cell can hold at most one point
  const cols = Math.ceil((maxX - minX) / cell);
  const rows = Math.ceil((maxZ - minZ) / cell);
  const grid: Grid = { cell, cols, rows, slots: new Int32Array(cols * rows).fill(-1) };
  const points: number[][] = [];

  for (let attempt = 0; attempt < maxAttempts && points.length < count; attempt += 1) {
    throwDart(options, grid, points);
  }

  return points;
}
