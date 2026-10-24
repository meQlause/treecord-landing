// 64 x 64 faceted icons: 4 pipeline nodes + 5 roles. Same light direction and palette as everything else.
import { mulberry32, HEX, svg, poly, blob, fan, leaf, ramp, mix } from './lowpoly.js';

const G = ramp(HEX.leafDark, HEX.leafLight);
const check = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${HEX.verified}" stroke="#FFFFFF" stroke-width="2"/>` +
  `<path d="M${cx - r * 0.45},${cy} L${cx - r * 0.1},${cy + r * 0.35} L${cx + r * 0.5},${cy - r * 0.35}" fill="none" stroke="#FFFFFF" stroke-width="${r * 0.28}" stroke-linecap="round" stroke-linejoin="round"/>`;
const tree = (x, y, h) =>
  poly(
    [
      [x, y - h],
      [x + h * 0.38, y],
      [x, y],
    ],
    HEX.leafLight,
  ) +
  poly(
    [
      [x, y - h],
      [x, y],
      [x - h * 0.38, y],
    ],
    HEX.leafMid,
  );
const coin = (cx, cy, r, dark, light) =>
  fan(
    Array.from({ length: 8 }, (_, i) => [
      cx + Math.cos((i / 8) * Math.PI * 2) * r,
      cy + Math.sin((i / 8) * Math.PI * 2) * r,
    ]),
    [cx, cy],
    ramp(dark, light),
  );

export const ICONS = {
  // pipeline nodes (B4)
  video: () =>
    poly(
      [
        [8, 18],
        [44, 18],
        [8, 46],
      ],
      HEX.leafMid,
    ) +
    poly(
      [
        [44, 18],
        [44, 46],
        [8, 46],
      ],
      HEX.leafDark,
    ) +
    poly(
      [
        [46, 26],
        [58, 18],
        [58, 32],
      ],
      HEX.leafLight,
    ) +
    poly(
      [
        [46, 26],
        [58, 32],
        [58, 46],
        [46, 38],
      ],
      HEX.leafMid,
    ) +
    `<circle cx="16" cy="25" r="3.2" fill="${HEX.flagged}"/>`,
  ai: () =>
    ['M8,20 L8,8 L20,8', 'M44,8 L56,8 L56,20', 'M8,44 L8,56 L20,56', 'M56,44 L56,56 L44,56']
      .map(
        (d) =>
          `<path d="${d}" fill="none" stroke="${HEX.leafDark}" stroke-width="4" stroke-linecap="round"/>`,
      )
      .join('') +
    fan(
      [
        [32, 14],
        [44, 32],
        [32, 50],
        [20, 32],
      ],
      [32, 32],
      G,
    ) +
    `<rect class="scan" x="12" y="31" width="40" height="2.5" rx="1.25" fill="${HEX.pending}"/>`,
  donor: () =>
    blob(mulberry32(71), 30, 21, 10, { n: 6, squash: 1, palette: G, gradient: false }) +
    poly(
      [
        [12, 56],
        [18, 37],
        [30, 34],
        [30, 56],
      ],
      HEX.leafDark,
    ) +
    poly(
      [
        [30, 34],
        [42, 37],
        [48, 56],
        [30, 56],
      ],
      HEX.leafMid,
    ) +
    check(47, 45, 9),
  chain: () =>
    poly(
      [
        [32, 10],
        [54, 22],
        [32, 34],
        [10, 22],
      ],
      HEX.leafLight,
    ) +
    poly(
      [
        [10, 22],
        [32, 34],
        [32, 58],
        [10, 46],
      ],
      HEX.leafMid,
    ) +
    poly(
      [
        [32, 34],
        [54, 22],
        [54, 46],
        [32, 58],
      ],
      HEX.leafDark,
    ) +
    leaf(26, 24, 12, 6, -0.5, '#FFFFFF', mix('#FFFFFF', HEX.leafLight, 0.5)),

  // roles (B7)
  donorRole: () =>
    fan(
      [
        [32, 56],
        [10, 33],
        [9, 21],
        [17, 12],
        [26, 12],
        [32, 19],
        [38, 12],
        [47, 12],
        [55, 21],
        [54, 33],
      ],
      [32, 30],
      ramp('#8E3A2A', '#E07A5F'),
    ) + coin(50, 50, 9, '#A8741F', '#F4D27A'),
  planter: () =>
    blob(mulberry32(72), 32, 52, 22, {
      n: 8,
      squash: 0.28,
      palette: ramp(HEX.soil, HEX.soilLight),
      gradient: false,
    }) +
    poly(
      [
        [30.5, 50],
        [33.5, 50],
        [33, 30],
        [31, 30],
      ],
      HEX.bark,
    ) +
    leaf(32, 32, 20, 10, Math.PI + 0.5, mix(HEX.sprout, HEX.leafMid, 0.55), HEX.sprout) +
    leaf(32, 30, 22, 11, -0.55, HEX.sprout, mix(HEX.sprout, HEX.leafMid, 0.55)),
  developer: () =>
    poly(
      [
        [32, 28],
        [58, 41],
        [32, 54],
        [6, 41],
      ],
      HEX.grassLight,
    ) +
    poly(
      [
        [6, 41],
        [32, 54],
        [32, 59],
        [6, 46],
      ],
      HEX.soilLight,
    ) +
    poly(
      [
        [32, 54],
        [58, 41],
        [58, 46],
        [32, 59],
      ],
      HEX.soil,
    ) +
    tree(22, 42, 18) +
    tree(34, 36, 22) +
    tree(42, 46, 16),
  verifier: () =>
    fan(
      [
        [32, 6],
        [54, 14],
        [52, 36],
        [32, 58],
        [12, 36],
        [10, 14],
      ],
      [32, 30],
      G,
    ) +
    `<circle cx="30" cy="28" r="9" fill="none" stroke="#FFFFFF" stroke-width="4"/><path d="M37,35 L45,43" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>`,
  buyer: () =>
    coin(28, 30, 20, HEX.leafDark, HEX.leafLight) +
    leaf(20, 38, 18, 9, -0.85, '#FFFFFF', mix('#FFFFFF', HEX.leafLight, 0.5)) +
    poly(
      [
        [42, 40],
        [58, 40],
        [58, 58],
        [50, 52],
        [42, 58],
      ],
      HEX.pending,
    ),
};

export const iconSVG = (name) =>
  svg('0 0 64 64', `<g class="icon">${ICONS[name]()}</g>`, `tc-icon tc-icon--${name}`);

/** Icon pops in, its facets settle with a small stagger. */
export function iconTimeline(root, gsap) {
  return gsap
    .timeline({ paused: true })
    .fromTo(
      root.querySelector('.icon'),
      { scale: 0, rotation: -12, svgOrigin: '32 32' },
      { scale: 1, rotation: 0, svgOrigin: '32 32', duration: 0.5, ease: 'back.out(1.9)' },
      0,
    )
    .from(
      root.querySelectorAll('.icon > polygon'),
      { opacity: 0, stagger: 0.02, duration: 0.2 },
      0.1,
    )
    .set({}, {}, 1);
}
