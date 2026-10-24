// The 2D twin of three-assets/src/hero-tree.js: same part layout (1 unit = 100 px), same pop-in order,
// same growth schedule, so the SVG tree and the 3D tree grow in lockstep from one progress value.
import { mulberry32, range, HEX, svg, blob, leaf, limb, ramp, mix } from './lowpoly.js';

const BASE = [200, 440];
const U = 100;
const P = (x, y) => [BASE[0] + x * U, BASE[1] - y * U];
const r1 = (n) => Math.round(n * 10) / 10;

// [x, y, z, r] in hero-tree units. z only sets draw order (far first).
const BLOBS = [
  [-0.75, 2.35, 0.2, 0.75],
  [0.8, 2.4, -0.15, 0.78],
  [0.1, 2.3, 0.75, 0.7],
  [-0.2, 2.45, -0.75, 0.72],
  [0, 2.75, 0, 0.95],
  [0.35, 3.25, 0.1, 0.6],
];

/** Crop that frames the tree at growth 0 (seedling on its mound). Tween the viewBox between this and TREE_VIEWBOX. */
// Frames the seedling; the mound runs past the crop, so give the <svg> `overflow: visible` to avoid hard edges.
export const SEEDLING_VIEWBOX = '100 362 200 104';
export const TREE_VIEWBOX = '0 0 400 480';

const part = (body, kind, [px, py], [start, end], shrink = false) =>
  `<g class="part ${kind}" data-pivot="${r1(px)} ${r1(py)}" data-grow="${start} ${r1(end * 100) / 100}"${shrink ? ' data-shrink=""' : ''}>${body}</g>`;

export function treeSVG({ seed = 11 } = {}) {
  const rng = mulberry32(seed);
  const mound = blob(rng, 200, 440, 120, {
    n: 9,
    squash: 0.18,
    palette: ramp(HEX.soil, HEX.soilLight),
    gradient: false,
  });
  const trunk = limb(P(0, 0), P(0, 1.9), 44, 22, rng, HEX.bark, HEX.barkLight, 4);

  const branches = [-1, 1].map((side) => {
    const start = P(0, 1.25);
    const end = [start[0] + side * 0.68 * 80, start[1] - 0.73 * 80];
    return part(
      limb(start, end, 9, 5, rng, HEX.bark, HEX.barkLight, 2),
      'branch',
      start,
      [0.1, 0.35],
    );
  });

  const blobs = BLOBS.map(([x, y, z, r], i) => ({
    z,
    markup: part(
      blob(rng, ...P(x, y), r * U * range(rng, 0.95, 1.05), { squash: 0.85 }),
      'blob',
      P(x, y - r * 0.3),
      [0.06 + i * 0.07, 0.36 + i * 0.07],
    ),
  }))
    .sort((a, b) => a.z - b.z)
    .map((b) => b.markup);

  const top = P(0, 1.9);
  const shade = mix(HEX.sprout, HEX.leafMid, 0.55);
  const sprouts = [
    part(
      leaf(top[0], top[1], 100, 34, Math.PI + 0.45, shade, HEX.sprout),
      'sprout',
      top,
      [0.08, 0.3],
      true,
    ),
    part(leaf(top[0], top[1], 100, 34, -0.45, HEX.sprout, shade), 'sprout', top, [0.08, 0.3], true),
  ];

  return svg(
    TREE_VIEWBOX,
    `<g class="mound">${mound}</g><g class="tree"><g class="trunk">${trunk}</g>${branches.join('')}${blobs.join('')}${sprouts.join('')}</g>`,
    'tc-tree',
  );
}

/**
 * Growth 0..1 as a paused timeline of duration 1, mirroring the hero-tree shader:
 * whole tree 0.14 -> 1 over 0..0.7 (power3.out), each part pops (back.out) in its own window.
 */
export function treeGrowth(root, gsap) {
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(
    root.querySelector('.tree'),
    { scale: 0.14, svgOrigin: '200 440' },
    { scale: 1, svgOrigin: '200 440', duration: 0.7, ease: 'power3.out' },
    0,
  );
  root.querySelectorAll('.part').forEach((p) => {
    const [start, end] = p.dataset.grow.split(' ').map(Number);
    const svgOrigin = p.dataset.pivot;
    if (p.hasAttribute('data-shrink'))
      tl.fromTo(
        p,
        { scale: 1, svgOrigin },
        { scale: 0, svgOrigin, duration: end - start, ease: 'power1.inOut' },
        start,
      );
    else
      tl.fromTo(
        p,
        { scale: 0, svgOrigin },
        { scale: 1, svgOrigin, duration: end - start, ease: 'back.out(1.7)' },
        start,
      );
  });
  return tl.set({}, {}, 1);
}

/** Seedling wilts (problem panel 1). Expects the tree at growth 0 (treeGrowth(...).progress(0)). */
export function treeWilt(root, gsap) {
  const tl = gsap.timeline({ paused: true });
  const [left, right] = root.querySelectorAll('.sprout');
  tl.to(
    root.querySelector('.tree'),
    { rotation: 9, svgOrigin: '200 440', duration: 0.6, ease: 'power2.in' },
    0.15,
  )
    .to(
      left,
      { rotation: -55, svgOrigin: left.dataset.pivot, duration: 0.6, ease: 'power2.in' },
      0.2,
    )
    .to(
      right,
      { rotation: 55, svgOrigin: right.dataset.pivot, duration: 0.6, ease: 'power2.in' },
      0.25,
    );
  const dry = (amount) => (i, el) => mix(el.getAttribute('fill'), HEX.dry, amount);
  tl.to(
    root.querySelectorAll('.sprout polygon, .trunk polygon'),
    { fill: dry(0.8), stroke: dry(0.8), duration: 0.6 },
    0.3,
  );
  tl.to(
    root.querySelectorAll('.mound polygon'),
    { fill: dry(0.45), stroke: dry(0.45), duration: 0.6 },
    0.3,
  );
  return tl.set({}, {}, 1);
}
