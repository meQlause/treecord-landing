// Pure helpers (no three.js import) so check.mjs can run them in Node.

/** Seeded PRNG: same seed, same forest. Returns floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rng, min, max) => min + (max - min) * rng();

export const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Deterministic hash of a position, in [0, 1). Inputs are quantised to 1 mm so
 * vertices that sit on the same spot (seams, shared corners) always get the same
 * value, which keeps jittered low-poly meshes watertight.
 */
export function hash3(x, y, z, k = 0) {
  const n =
    Math.sin(
      Math.round(x * 1000) * 0.1271 +
        Math.round(y * 1000) * 0.3117 +
        Math.round(z * 1000) * 0.0747 +
        k * 19.19,
    ) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Random points on a rectangle with a minimum spacing (dart throwing on a grid).
 * Returns [[x, z], ...]. Stops at `count` points or after `maxAttempts` darts.
 * ponytail: dart throwing saturates near ~50% coverage; switch to Bridson
 * Poisson-disk sampling if a much denser forest is ever needed.
 */
export function scatter({
  count,
  minX,
  maxX,
  minZ,
  maxZ,
  minDist,
  clearings = [],
  rng,
  maxAttempts = count * 40,
}) {
  const cell = minDist / Math.SQRT2; // a cell can hold at most one point
  const cols = Math.ceil((maxX - minX) / cell);
  const rows = Math.ceil((maxZ - minZ) / cell);
  const grid = new Int32Array(cols * rows).fill(-1);
  const points = [];

  for (let attempt = 0; attempt < maxAttempts && points.length < count; attempt++) {
    const x = range(rng, minX, maxX);
    const z = range(rng, minZ, maxZ);
    if (clearings.some((c) => Math.hypot(x - c.x, z - c.z) < c.r)) continue;

    const cx = Math.floor((x - minX) / cell);
    const cz = Math.floor((z - minZ) / cell);
    let free = true;
    for (let gz = Math.max(0, cz - 2); free && gz <= Math.min(rows - 1, cz + 2); gz++) {
      for (let gx = Math.max(0, cx - 2); gx <= Math.min(cols - 1, cx + 2); gx++) {
        const j = grid[gz * cols + gx];
        if (j >= 0 && Math.hypot(points[j][0] - x, points[j][1] - z) < minDist) {
          free = false;
          break;
        }
      }
    }
    if (!free) continue;

    grid[cz * cols + cx] = points.length;
    points.push([x, z]);
  }
  return points;
}
