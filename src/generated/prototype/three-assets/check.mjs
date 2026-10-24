// Run: node check.mjs
import assert from 'node:assert/strict';
import { mulberry32, scatter, hash3 } from './src/random.js';

const a = mulberry32(42);
const b = mulberry32(42);
for (let i = 0; i < 5; i++) assert.equal(a(), b(), 'same seed gives the same sequence');

const opts = {
  count: 700,
  minX: -20,
  maxX: 20,
  minZ: -20,
  maxZ: 20,
  minDist: 1,
  clearings: [{ x: 0, z: 0, r: 4 }],
};
const pts = scatter({ ...opts, rng: mulberry32(1) });
assert.deepEqual(pts, scatter({ ...opts, rng: mulberry32(1) }), 'scatter is deterministic');
assert.equal(pts.length, opts.count, 'scatter reaches the requested count');
for (const [x, z] of pts) {
  assert.ok(x >= -20 && x < 20 && z >= -20 && z < 20, 'inside bounds');
  assert.ok(Math.hypot(x, z) >= 4, 'outside the clearing');
}
for (let i = 0; i < pts.length; i++)
  for (let j = i + 1; j < pts.length; j++)
    assert.ok(
      Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) >= 1,
      'minimum spacing holds',
    );

assert.equal(
  hash3(1.0001, 2, 3),
  hash3(1.0002, 2, 3),
  'near-identical seam vertices hash the same',
);
assert.notEqual(hash3(1, 2, 3), hash3(1.5, 2, 3), 'different positions hash differently');

console.log('ok: random, scatter, hash3');
