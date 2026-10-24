// Story objects. Each asset = markup function + a paused timeline of duration 1 (scrub it from a ScrollTrigger).
import {
  mulberry32,
  range,
  HEX,
  svg,
  poly,
  blob,
  fan,
  leaf,
  limb,
  ramp,
  mix,
  shadeFaces,
} from './lowpoly.js';

const MONO = `font-family="JetBrains Mono, ui-monospace, monospace"`;
const ring = (cx, cy, r, n, offset = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((i + offset) / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/**
 * Place one asset's <svg> inside another at (x, y, w, h). Wrapped in a <g> because browsers ignore
 * `transform` on nested <svg> elements, so the <g> is what GSAP moves and scales.
 */
export const nest = (markup, x, y, w, h, cls = '') =>
  `<g${cls ? ` data-nest="${cls}"` : ''}>${markup.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `)}</g>`;

// ---------------------------------------------------------------- coin
const COIN_TONES = {
  gold: ['#A8741F', '#F4D27A', HEX.leafMid], // planter incentive (USDC payout)
  green: [HEX.leafDark, HEX.leafLight, '#FFFFFF'], // carbon credit, twin of the 3D particle coin
};

export function coinSVG({ tone = 'gold' } = {}) {
  const [dark, light, emblem] = COIN_TONES[tone];
  const outer = ring(50, 50, 46, 10);
  const inner = ring(50, 50, 35, 10, 0.5);
  const rim = [];
  for (let i = 0; i < 10; i++) {
    const j = (i + 1) % 10;
    rim.push([outer[i], outer[j], inner[i]], [inner[i], outer[j], inner[j]]);
  }
  const body =
    shadeFaces(rim, 50, 50, ramp(dark, light)) +
    fan(inner, [50, 50], ramp(mix(dark, light, 0.45), mix(light, '#FFFFFF', 0.3))) +
    leaf(38, 64, 30, 15, -0.85, emblem, mix(emblem, dark, 0.35));
  return svg('0 0 100 100', `<g class="coin-body">${body}</g>`, `tc-coin tc-coin--${tone}`);
}

export function coinTimeline(root, gsap) {
  const body = root.querySelector('.coin-body');
  const o = '50 50';
  return gsap
    .timeline({ paused: true })
    .fromTo(
      body,
      { scale: 0, y: 24, svgOrigin: o },
      { scale: 1, y: 0, svgOrigin: o, duration: 0.4, ease: 'back.out(1.7)' },
      0,
    )
    .to(body, { scaleX: 0.1, svgOrigin: o, duration: 0.15, ease: 'sine.in' }, 0.55)
    .to(body, { scaleX: 1, svgOrigin: o, duration: 0.15, ease: 'sine.out' }, 0.7)
    .set({}, {}, 1);
}

// ---------------------------------------------------------------- donors fund blindly: coins fly from a donor's phone into fog
export function blindFundingSVG() {
  const rng = mulberry32(31);
  const phone =
    fan(
      [
        [22, 70],
        [74, 70],
        [80, 78],
        [80, 196],
        [74, 204],
        [22, 204],
        [16, 196],
        [16, 78],
      ],
      [48, 136],
      ramp('#121517', '#3A403C'),
    ) +
    `<rect x="22" y="80" width="52" height="112" rx="6" fill="${HEX.primarySoft}"/>` +
    fan(
      [
        [48, 152],
        [34, 138],
        [34, 128],
        [40, 122],
        [46, 122],
        [48, 126],
        [50, 122],
        [56, 122],
        [62, 128],
        [62, 138],
      ],
      [48, 134],
      ramp('#8E3A2A', '#E07A5F'),
    );
  const arc = `<path class="arc" d="M60,110 C120,10 220,10 272,96" fill="none" stroke="#C9C6BC" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;
  const cloud = [
    [262, 118, 46],
    [312, 96, 58],
    [356, 118, 44],
    [290, 138, 40],
    [336, 140, 40],
  ]
    .map(([x, y, r]) => blob(rng, x, y, r, { palette: ramp('#D6D2C7', '#FFFFFF'), squash: 0.8 }))
    .join('');
  // three coins wait at the start of the arc (60, 110); MotionPath carries them into the cloud
  const coins = [0, 1, 2].map(() => nest(coinSVG(), 43, 93, 34, 34, 'coin')).join('');
  const marks = [
    [262, 46],
    [312, 30],
    [358, 54],
  ]
    .map(
      ([x, y]) =>
        `<text class="q" x="${x}" y="${y}" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="34" fill="${HEX.muted}" opacity="0">?</text>`,
    )
    .join('');
  return svg(
    '0 0 400 220',
    `<g class="donor">${phone}</g>${arc}<g class="coins">${coins}</g><g class="cloud">${cloud}</g>${marks}`,
    'tc-blind',
  );
}

export function blindFundingTimeline(root, gsap) {
  const arc = root.querySelector('.arc');
  const cloud = root.querySelector('.cloud');
  const tl = gsap.timeline({ paused: true });
  tl.from(
    root.querySelector('.donor'),
    { x: -30, opacity: 0, duration: 0.15, ease: 'power2.out' },
    0,
  )
    .from(cloud, { x: 40, opacity: 0, duration: 0.25, ease: 'power2.out' }, 0.05)
    .from(arc, { opacity: 0, duration: 0.12 }, 0.12); // fade, not DrawSVG: DrawSVG would replace the dotted dash pattern
  root.querySelectorAll('[data-nest=coin]').forEach((coin, i) => {
    const at = 0.24 + i * 0.12;
    tl.fromTo(coin, { opacity: 0 }, { opacity: 1, duration: 0.03 }, at)
      .to(
        coin,
        {
          motionPath: { path: arc, align: arc, alignOrigin: [0.5, 0.5] },
          duration: 0.3,
          ease: 'power1.in',
        },
        at,
      )
      .to(coin, { opacity: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.06 }, at + 0.26);
  });
  tl.to(
    cloud,
    {
      scale: 1.05,
      transformOrigin: '50% 50%',
      duration: 0.05,
      yoyo: true,
      repeat: 3,
      ease: 'sine.inOut',
    },
    0.55,
  ).fromTo(
    root.querySelectorAll('.q'),
    { opacity: 0, y: 14, scale: 0.6, transformOrigin: '50% 100%' },
    { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.12, ease: 'back.out(2.5)' },
    0.74,
  );
  return tl.set({}, {}, 1);
}

// ---------------------------------------------------------------- carbon market trust gap: certificate cracks, its price tag drops
const CRACK = [
  [134, 20],
  [124, 70],
  [140, 118],
  [122, 170],
  [142, 222],
  [128, 268],
  [136, 300],
];

export function certificateSVG() {
  const paper = ramp('#E4DFD2', '#FFFFFF');
  const bar = (x, y, w, h = 7, fill = '#D3D1C7') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.5" fill="${fill}"/>`;
  const lines = (x, w) =>
    [84, 100, 116, 140, 156, 172, 196, 212]
      .map((y, i) => bar(x, y, w * (i % 3 === 2 ? 0.6 : 1)))
      .join('');

  const left =
    fan([[20, 20], ...CRACK, [20, 300]], [72, 160], paper) +
    bar(40, 44, 74, 12, HEX.primary) +
    lines(40, 70);
  const seal =
    blob(mulberry32(41), 194, 250, 24, {
      n: 8,
      squash: 1,
      palette: ramp(HEX.leafDark, HEX.verified),
      gradient: false,
    }) +
    poly(
      [
        [182, 268],
        [176, 296],
        [188, 288],
        [194, 300],
      ],
      HEX.leafDark,
    ) +
    poly(
      [
        [206, 268],
        [212, 296],
        [200, 288],
        [194, 300],
      ],
      HEX.primary,
    );
  const right =
    fan([...CRACK, [240, 300], [240, 20]], [190, 160], paper) +
    bar(156, 44, 50, 12, HEX.primary) +
    lines(156, 64) +
    `<g class="seal">${seal}</g>`;

  const crack = `<path class="crack" d="M${CRACK.map((p) => p.join(',')).join(' L')}" fill="none" stroke="${HEX.text}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  // the price tag hangs off the top-right corner; its arrow points down (a credit sold at a discount)
  const tag =
    `<g class="pricetag" opacity="0"><path d="M238,22 L280,68" stroke="#B9B5AA" stroke-width="2"/>` +
    fan(
      [
        [280, 58],
        [302, 76],
        [302, 132],
        [258, 132],
        [258, 76],
      ],
      [280, 98],
      ramp('#E4DFD2', '#FFFFFF'),
    ) +
    `<circle cx="280" cy="72" r="4" fill="${HEX.bg}" stroke="#CFCBC0" stroke-width="1.5"/>` +
    `<path class="down" d="M280,88 L280,118 M270,108 L280,120 L290,108" fill="none" stroke="${HEX.flagged}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return svg(
    '0 0 312 320',
    `<g class="half left">${left}</g><g class="half right">${right}</g>${crack}${tag}`,
    'tc-certificate',
  );
}

export function certificateTimeline(root, gsap) {
  const tl = gsap.timeline({ paused: true });
  tl.from(
    root.querySelectorAll('.half'),
    { y: 30, opacity: 0, duration: 0.2, ease: 'power2.out' },
    0,
  )
    .fromTo(
      root.querySelector('.crack'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.4, ease: 'power1.in' },
      0.2,
    )
    .to(
      root.querySelector('.left'),
      { rotation: -6, x: -8, svgOrigin: '20 300', duration: 0.35, ease: 'power2.out' },
      0.62,
    )
    .to(
      root.querySelector('.right'),
      { rotation: 6, x: 8, svgOrigin: '240 300', duration: 0.35, ease: 'power2.out' },
      0.62,
    )
    .to(
      root.querySelectorAll('.seal polygon'),
      { fill: '#A5ABA7', stroke: '#A5ABA7', duration: 0.3 },
      0.65,
    )
    .fromTo(
      root.querySelector('.pricetag'),
      { opacity: 0, rotation: -70, svgOrigin: '238 22' },
      { opacity: 1, rotation: 0, svgOrigin: '238 22', duration: 0.25, ease: 'elastic.out(1, 0.5)' },
      0.7,
    )
    .fromTo(
      root.querySelector('.down'),
      { y: -6 },
      { y: 4, duration: 0.06, yoyo: true, repeat: 3, ease: 'sine.inOut' },
      0.86,
    );
  return tl.set({}, {}, 1);
}

// ---------------------------------------------------------------- planter phone (signed video proof)
/** Sample proof values. Illustrative only. */
export const PROOF_ROWS = [
  'GPS  -6.5924, 106.7969  ±8 m',
  'TIME 2026-10-20 07:42:13',
  'SIG  0x9f3a…c21e  verified',
];

export function phoneSVG({ rows = PROOF_ROWS } = {}) {
  const rng = mulberry32(51);
  const body = fan(
    [
      [34, 10],
      [286, 10],
      [310, 34],
      [310, 566],
      [286, 590],
      [34, 590],
      [10, 566],
      [10, 34],
    ],
    [160, 300],
    ramp('#121517', '#3A403C'),
  );
  const scene =
    `<rect x="24" y="40" width="272" height="520" fill="${HEX.primarySoft}"/>` +
    blob(rng, 160, 520, 230, { n: 9, squash: 0.42, palette: ramp(HEX.grassDark, HEX.grassLight) }) +
    blob(rng, 160, 392, 70, {
      n: 8,
      squash: 0.2,
      palette: ramp(HEX.soil, HEX.soilLight),
      gradient: false,
    }) +
    limb([160, 392], [160, 330], 7, 4, rng, HEX.bark, HEX.barkLight, 2) +
    leaf(160, 332, 48, 18, Math.PI + 0.45, mix(HEX.sprout, HEX.leafMid, 0.55), HEX.sprout) +
    leaf(160, 332, 48, 18, -0.45, HEX.sprout, mix(HEX.sprout, HEX.leafMid, 0.55));
  const bracket = (d) =>
    `<path class="bracket" d="${d}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`;
  const brackets = [
    'M60,240 L60,210 L90,210',
    'M260,240 L260,210 L230,210',
    'M60,380 L60,410 L90,410',
    'M260,380 L260,410 L230,410',
  ]
    .map(bracket)
    .join('');
  const rec = `<g class="rec"><circle cx="50" cy="70" r="6" fill="${HEX.flagged}"/><text x="62" y="75" ${MONO} font-size="13" font-weight="700" fill="${HEX.text}">REC</text></g>`;
  const panel =
    `<rect class="panel" x="38" y="440" width="244" height="78" rx="10" fill="#FFFFFF" fill-opacity="0.9" stroke="${HEX.verified}" stroke-opacity="0" stroke-width="2"/>` +
    rows
      .map(
        (text, i) =>
          `<text class="row" data-text="${text}" x="52" y="${466 + i * 20}" ${MONO} font-size="11" fill="${HEX.text}"></text>`,
      )
      .join('');
  return svg(
    '0 0 320 600',
    `<defs><clipPath id="tc-screen"><rect x="24" y="40" width="272" height="520" rx="18"/></clipPath></defs>` +
      `<g class="phone">${body}<g clip-path="url(#tc-screen)">${scene}${brackets}${rec}${panel}</g>` +
      `<rect x="130" y="20" width="60" height="8" rx="4" fill="#0B0D0E"/></g>`,
    'tc-phone',
  );
}

/** Screen-area crop, for a viewBox zoom from the whole phone into the proof on its screen. */
export const PHONE_SCREEN_VIEWBOX = '30 120 260 488'; // same aspect as PHONE_VIEWBOX, so the zoom never letterboxes
export const PHONE_VIEWBOX = '0 0 320 600';

export function phoneTimeline(root, gsap) {
  const tl = gsap.timeline({ paused: true });
  tl.from(root.querySelector('.phone'), { y: 80, opacity: 0, duration: 0.2, ease: 'power2.out' }, 0)
    .from(
      root.querySelectorAll('.bracket'),
      { scale: 1.35, opacity: 0, svgOrigin: '160 310', duration: 0.15, ease: 'power2.out' },
      0.15,
    )
    .to(
      root.querySelector('.rec circle'),
      { opacity: 0.15, duration: 0.05, repeat: 11, yoyo: true, ease: 'none' },
      0.2,
    );
  root.querySelectorAll('.row').forEach((row, i) => {
    tl.to(
      row,
      {
        duration: 0.14,
        ease: 'none',
        scrambleText: { text: row.dataset.text, chars: '0123456789abcdef', speed: 1 },
      },
      0.38 + i * 0.15,
    );
  });
  tl.to(root.querySelector('.panel'), { attr: { 'stroke-opacity': 1 }, duration: 0.08 }, 0.86);
  return tl.set({}, {}, 1);
}

// ---------------------------------------------------------------- GPS lock: pin drops, rings draw
export function gpsSVG() {
  const rings = [36, 66, 96]
    .map(
      (r, i) =>
        `<ellipse class="ring" cx="120" cy="150" rx="${r}" ry="${r * 0.36}" fill="none" stroke="${HEX.verified}" stroke-width="${3 - i * 0.6}" stroke-opacity="${1 - i * 0.25}"/>`,
    )
    .join('');
  const pin =
    fan(
      [
        [120, 150],
        [98, 108],
        [97, 90],
        [106, 74],
        [120, 67],
        [134, 74],
        [143, 90],
        [142, 108],
      ],
      [120, 96],
      ramp(HEX.leafDark, HEX.verified),
    ) + `<circle cx="120" cy="92" r="8" fill="#FFFFFF"/>`;
  return svg('0 0 240 220', `${rings}<g class="pin">${pin}</g>`, 'tc-gps');
}

export function gpsTimeline(root, gsap) {
  const rings = root.querySelectorAll('.ring');
  return gsap
    .timeline({ paused: true })
    .from(root.querySelector('.pin'), { y: -90, opacity: 0, duration: 0.35, ease: 'bounce.out' }, 0)
    .fromTo(
      rings,
      { drawSVG: '50% 50%' },
      { drawSVG: '0% 100%', stagger: 0.1, duration: 0.3, ease: 'power2.out' },
      0.3,
    )
    .to(
      rings,
      {
        scale: 1.12,
        svgOrigin: '120 150',
        stagger: 0.05,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      },
      0.7,
    )
    .set({}, {}, 1);
}

// ---------------------------------------------------------------- signature seal (proof is locked)
export function shieldSVG() {
  const body = fan(
    [
      [60, 8],
      [104, 22],
      [100, 72],
      [60, 128],
      [20, 72],
      [16, 22],
    ],
    [60, 60],
    ramp(HEX.leafDark, HEX.verified),
  );
  const check = `<path class="check" d="M38,66 L54,82 L84,48" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg('0 0 120 140', `<g class="shield">${body}${check}</g>`, 'tc-shield');
}

export function shieldTimeline(root, gsap) {
  return gsap
    .timeline({ paused: true })
    .fromTo(
      root.querySelector('.shield'),
      { scale: 0, rotation: -20, svgOrigin: '60 70' },
      { scale: 1, rotation: 0, svgOrigin: '60 70', duration: 0.45, ease: 'back.out(1.8)' },
      0,
    )
    .fromTo(
      root.querySelector('.check'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.35, ease: 'power2.out' },
      0.45,
    )
    .set({}, {}, 1);
}

// ---------------------------------------------------------------- registry serial tag (B6)
/** Sample registry values. Illustrative only. */
export function serialSVG({
  meta = 'SRN PPI · VINTAGE 2026 · 1 tCO₂e',
  serial = 'IDN-2026-000123',
} = {}) {
  const body =
    fan(
      [
        [44, 10],
        [370, 10],
        [370, 120],
        [44, 120],
        [8, 65],
      ],
      [190, 65],
      ramp('#E4DFD2', '#FFFFFF'),
    ) +
    poly(
      [
        [44, 10],
        [54, 10],
        [54, 120],
        [44, 120],
      ],
      HEX.primary,
    ) +
    `<circle cx="30" cy="65" r="7" fill="${HEX.bg}" stroke="#CFCBC0" stroke-width="2"/>` +
    `<text x="72" y="48" ${MONO} font-size="13" fill="${HEX.muted}">${meta}</text>` +
    `<text class="serial" data-text="${serial}" x="72" y="90" ${MONO} font-size="24" font-weight="700" fill="${HEX.primary}">${serial.replace(/./g, '·')}</text>`;
  return svg('0 0 380 130', `<g class="tag">${body}</g>`, 'tc-serial');
}

export function serialTimeline(root, gsap) {
  const serial = root.querySelector('.serial');
  return gsap
    .timeline({ paused: true })
    .from(root.querySelector('.tag'), { x: -60, opacity: 0, duration: 0.25, ease: 'power3.out' }, 0)
    .to(
      serial,
      {
        duration: 0.55,
        ease: 'none',
        scrambleText: { text: serial.dataset.text, chars: '0123456789ABCDEF-', speed: 0.6 },
      },
      0.25,
    )
    .set({}, {}, 1);
}

// ---------------------------------------------------------------- logo mark
export function logoSVG() {
  const crown = [
    [
      [32, 5],
      [44, 25],
      [20, 25],
    ],
    [
      [20, 25],
      [32, 45],
      [8, 45],
    ],
    [
      [44, 25],
      [56, 45],
      [32, 45],
    ],
    [
      [20, 25],
      [44, 25],
      [32, 45],
    ],
  ];
  const body =
    shadeFaces(crown, 32, 30, ramp(HEX.leafDark, HEX.leafLight), { attrs: 'class="facet"' }) +
    `<g class="trunk">${poly(
      [
        [29, 45],
        [32, 45],
        [32, 58],
        [29, 58],
      ],
      HEX.bark,
    )}${poly(
      [
        [32, 45],
        [35, 45],
        [35, 58],
        [32, 58],
      ],
      HEX.barkLight,
    )}</g>` +
    `<g class="badge"><circle cx="49" cy="49" r="10" fill="${HEX.verified}" stroke="${HEX.bg}" stroke-width="2.5"/>` +
    `<path class="check" d="M44.5,49 L48,52.5 L54,45.5" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return svg('0 0 64 64', body, 'tc-logo');
}

export function logoTimeline(root, gsap) {
  const rng = mulberry32(61);
  return gsap
    .timeline({ paused: true })
    .from(
      root.querySelectorAll('.facet'),
      {
        x: () => range(rng, -40, 40),
        y: () => range(rng, -40, 20),
        rotation: () => range(rng, -120, 120),
        opacity: 0,
        transformOrigin: '50% 50%',
        stagger: 0.08,
        duration: 0.45,
        ease: 'power3.out',
      },
      0,
    )
    .from(
      root.querySelector('.trunk'),
      { scaleY: 0, svgOrigin: '32 58', duration: 0.25, ease: 'power2.out' },
      0.1,
    )
    .from(
      root.querySelector('.badge'),
      { scale: 0, svgOrigin: '49 49', duration: 0.25, ease: 'back.out(2)' },
      0.62,
    )
    .fromTo(
      root.querySelector('.badge .check'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.15 },
      0.82,
    )
    .set({}, {}, 1);
}
