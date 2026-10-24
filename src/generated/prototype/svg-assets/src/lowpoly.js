// Low-poly SVG primitives. Pure string builders (no DOM), so they run in Node too.
import { mulberry32, range, hash3 } from '../../three-assets/src/random.js';
import { HEX } from '../../three-assets/src/palette.js';

export { mulberry32, range, HEX };

const r1 = (n) => Math.round(n * 10) / 10;
export const pts = (points) => points.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');

/** A filled triangle or polygon. The same-colour hairline stroke hides anti-aliasing seams between facets. */
export const poly = (points, fill, attrs = '') =>
  `<polygon points="${pts(points)}" fill="${fill}" stroke="${fill}" stroke-width="0.6" stroke-linejoin="round"${attrs ? ' ' + attrs : ''}/>`;

export const svg = (viewBox, body, cls = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${cls ? ` class="${cls}"` : ''} aria-hidden="true" focusable="false">${body}</svg>`;

// ---------------------------------------------------------------- colour
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export function mix(a, b, t) {
  const A = rgb(a);
  const B = rgb(b);
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * Math.min(Math.max(t, 0), 1))
        .toString(16)
        .padStart(2, '0'),
    ).join('')
  );
}

/** Same foliage ramp as three-assets crownColor(): dark underside, sunlit top. */
export function crown(t) {
  let c = mix(HEX.leafDark, HEX.leafMid, Math.min(t * 1.6, 1));
  if (t > 0.55) c = mix(c, HEX.leafLight, ((t - 0.55) / 0.45) * 0.85);
  return c;
}
/** Two-colour ramp, for soil, paper, coins, icons. */
export const ramp = (dark, light) => (t) => mix(dark, light, t);

// Sun from the upper right, the same side as the 3D DirectionalLight at (12, 20, 8). SVG y points down.
const LIGHT = [0.55, -0.83];

/** 0..1 brightness of a facet that faces away from its shape's centre along (dx, dy). */
export function lit(dx, dy, h = 0.5) {
  const l = Math.hypot(dx, dy) || 1;
  const facing = (dx * LIGHT[0] + dy * LIGHT[1]) / l;
  return Math.min(Math.max((0.5 + 0.5 * facing) * 0.8 + h * 0.2, 0), 1);
}

const centroid = (f) => [
  f.reduce((s, p) => s + p[0], 0) / f.length,
  f.reduce((s, p) => s + p[1], 0) / f.length,
];

/** Shade a list of triangles around (cx, cy) with `palette(t)`; `top`/`height` add a vertical gradient. */
export function shadeFaces(
  faces,
  cx,
  cy,
  palette,
  { top = null, height = 1, k = 0, attrs = '' } = {},
) {
  return faces
    .map((f) => {
      const [fx, fy] = centroid(f);
      let t = lit(fx - cx, fy - cy, hash3(fx, fy, 0, k));
      if (top !== null) t = t * 0.7 + (1 - Math.min(Math.max((fy - top) / height, 0), 1)) * 0.3;
      return poly(f, palette(t), attrs);
    })
    .join('');
}

/** Fan a convex-ish outline from a centre point into triangles, shaded by facing. */
export function fan(outline, center, palette, opts) {
  const faces = outline.map((p, i) => [center, p, outline[(i + 1) % outline.length]]);
  return shadeFaces(faces, center[0], center[1], palette, opts);
}

/**
 * Low-poly blob, the 2D twin of a jittered icosahedron: centre fan + inner ring + outer ring = 3n facets.
 * Returns polygon markup.
 */
export function blob(
  rng,
  cx,
  cy,
  r,
  { n = 7, squash = 0.86, palette = crown, gradient = true } = {},
) {
  const ring = (rad, offset) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((i + offset) / n) * Math.PI * 2 + range(rng, -0.12, 0.12);
      const rr = rad * range(rng, 0.88, 1.1);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash];
    });
  const outer = ring(r, 0);
  const inner = ring(r * 0.55, 0.5);
  const c = [cx + range(rng, -r * 0.08, r * 0.08), cy - r * 0.1];
  const faces = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push(
      [outer[i], outer[j], inner[i]],
      [inner[i], outer[j], inner[j]],
      [c, inner[i], inner[j]],
    );
  }
  return shadeFaces(
    faces,
    cx,
    cy,
    palette,
    gradient ? { top: cy - r * squash, height: 2 * r * squash } : {},
  );
}

/** A leaf: diamond split along its midrib, lit side lighter. Points from base (bx, by) along `angle` (radians, 0 = right). */
export function leaf(bx, by, length, width, angle, light, dark) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const at = (u, v) => [bx + u * cos - v * sin, by + u * sin + v * cos];
  const base = at(0, 0);
  const tip = at(length, 0);
  const a = at(length * 0.45, -width / 2);
  const b = at(length * 0.45, width / 2);
  return poly([base, a, tip], light) + poly([base, tip, b], dark);
}

/** A tapered limb (trunk, branch) as two facets: shadow side and lit side. */
export function limb(
  [x0, y0],
  [x1, y1],
  w0,
  w1,
  rng,
  dark = HEX.bark,
  light = HEX.barkLight,
  segments = 3,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const out = [];
  for (let s = 0; s < segments; s++) {
    const t0 = s / segments;
    const t1 = (s + 1) / segments;
    const p = (t, side) => {
      const w = (w0 + (w1 - w0) * t) / 2;
      const j = t > 0 && t < 1 ? range(rng, -w * 0.15, w * 0.15) : 0;
      return [x0 + dx * t + nx * (w * side + j), y0 + dy * t + ny * (w * side + j)];
    };
    const mid0 = [x0 + dx * t0, y0 + dy * t0];
    const mid1 = [x0 + dx * t1, y0 + dy * t1];
    const k = range(rng, 0, 0.25);
    out.push(poly([p(t0, -1), mid0, mid1, p(t1, -1)], mix(dark, light, k)));
    out.push(poly([mid0, p(t0, 1), p(t1, 1), mid1], mix(dark, light, 0.75 + k)));
  }
  return out.join('');
}
