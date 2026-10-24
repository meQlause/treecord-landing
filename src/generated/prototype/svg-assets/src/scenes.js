// Composite scenes for the story beats, built from the same low-poly primitives.
// Each = markup function + paused timeline of duration 1.
import { mulberry32, range, HEX, svg, poly, blob, fan, leaf, limb, ramp, mix } from './lowpoly.js';

const cone = (x, y, h) =>
  poly(
    [
      [x, y - h],
      [x + h * 0.36, y],
      [x, y],
    ],
    HEX.leafLight,
  ) +
  poly(
    [
      [x, y - h],
      [x, y],
      [x - h * 0.36, y],
    ],
    HEX.leafMid,
  );

// ---------------------------------------------------------------- "Planted. Photographed. Forgotten."
/** A polaroid of a fresh seedling: the flash fires, then the seedling wilts, the photo yellows and the card is tossed aside. */
export function forgottenSVG() {
  const rng = mulberry32(61);
  const card = fan(
    [
      [14, 16],
      [246, 12],
      [248, 298],
      [12, 296],
    ],
    [130, 155],
    ramp('#E9E6DD', '#FFFFFF'),
  );
  const shadow = `<polygon points="22,26 256,24 258,308 20,306" fill="${HEX.text}" fill-opacity="0.08"/>`;
  const photo =
    `<rect x="30" y="30" width="200" height="190" fill="${HEX.primarySoft}"/>` +
    blob(rng, 130, 262, 170, { n: 9, squash: 0.42, palette: ramp(HEX.grassDark, HEX.grassLight) }) +
    `<g class="mound">${blob(rng, 130, 194, 50, { n: 8, squash: 0.26, palette: ramp(HEX.soil, HEX.soilLight), gradient: false })}</g>` +
    `<g class="stem">${limb([130, 194], [130, 150], 7, 4, rng, HEX.bark, HEX.barkLight, 2)}</g>` +
    `<g class="leafL" data-pivot="130 152">${leaf(130, 152, 46, 17, Math.PI + 0.45, mix(HEX.sprout, HEX.leafMid, 0.55), HEX.sprout)}</g>` +
    `<g class="leafR" data-pivot="130 152">${leaf(130, 152, 46, 17, -0.45, HEX.sprout, mix(HEX.sprout, HEX.leafMid, 0.55))}</g>` +
    `<rect class="sepia" x="30" y="30" width="200" height="190" fill="#C9A66B" opacity="0" style="mix-blend-mode:multiply"/>` +
    `<rect class="flash" x="30" y="30" width="200" height="190" fill="#FFFFFF" opacity="0"/>`;
  const caption =
    `<text x="40" y="262" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="700" fill="${HEX.muted}">DAY 1</text>` +
    `<path d="M196,250 L204,260 L222,240" fill="none" stroke="${HEX.verified}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(
    '0 0 270 320',
    `<defs><clipPath id="tc-polaroid"><rect x="30" y="30" width="200" height="190"/></clipPath></defs>` +
      `<g class="card">${shadow}${card}<g clip-path="url(#tc-polaroid)">${photo}</g>${caption}</g>`,
    'tc-forgotten',
  );
}

export function forgottenTimeline(root, gsap) {
  const o = '130 160';
  const dry = (amount) => (i, el) => mix(el.getAttribute('fill'), HEX.dry, amount);
  return gsap
    .timeline({ paused: true })
    .fromTo(
      root.querySelector('.card'),
      { y: -40, rotation: -8, opacity: 0, svgOrigin: o },
      { y: 0, rotation: -2, opacity: 1, svgOrigin: o, duration: 0.2, ease: 'power3.out' },
      0,
    )
    .to(root.querySelector('.flash'), { opacity: 1, duration: 0.03 }, 0.22)
    .to(root.querySelector('.flash'), { opacity: 0, duration: 0.12 }, 0.25)
    .to(
      root.querySelector('.leafL'),
      { rotation: -55, svgOrigin: '130 152', duration: 0.35, ease: 'power2.in' },
      0.42,
    )
    .to(
      root.querySelector('.leafR'),
      { rotation: 55, svgOrigin: '130 152', duration: 0.35, ease: 'power2.in' },
      0.45,
    )
    .to(
      root.querySelector('.stem'),
      { rotation: 12, svgOrigin: '130 194', duration: 0.35, ease: 'power2.in' },
      0.45,
    )
    .to(
      root.querySelectorAll('.leafL polygon, .leafR polygon, .stem polygon'),
      { fill: dry(0.8), stroke: dry(0.8), duration: 0.35 },
      0.45,
    )
    .to(root.querySelector('.sepia'), { opacity: 0.45, duration: 0.35 }, 0.5)
    .to(
      root.querySelector('.card'),
      { rotation: 9, y: 16, opacity: 0.7, svgOrigin: o, duration: 0.2, ease: 'power2.in' },
      0.8,
    )
    .set({}, {}, 1);
}

// ---------------------------------------------------------------- field check: map tile, satellite, GPS lock
/** An isometric tile of forest; a satellite sweeps it (vegetation check), the pin drops and the GPS rings lock. */
export function fieldCheckSVG() {
  const rng = mulberry32(71);
  const tile =
    fan(
      [
        [170, 140],
        [310, 205],
        [170, 270],
        [30, 205],
      ],
      [170, 205],
      ramp(HEX.grassDark, HEX.grassLight),
    ) +
    poly(
      [
        [30, 205],
        [170, 270],
        [170, 290],
        [30, 225],
      ],
      HEX.soilLight,
    ) +
    poly(
      [
        [170, 270],
        [310, 205],
        [310, 225],
        [170, 290],
      ],
      HEX.soil,
    ) +
    [0.25, 0.5, 0.75]
      .map((k) => {
        const a = [30 + 140 * k, 205 - 65 * k];
        const b = [170 + 140 * k, 270 - 65 * k];
        const c = [30 + 140 * k, 205 + 65 * k];
        const d = [170 + 140 * k, 140 + 65 * k];
        return `<path d="M${a} L${b} M${c} L${d}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5"/>`;
      })
      .join('');
  const trees = [
    [90, 205, 26],
    [118, 186, 22],
    [236, 196, 28],
    [262, 214, 22],
    [210, 236, 24],
    [120, 232, 20],
  ]
    .map(([x, y, h]) => `<g class="tree">${cone(x, y, h * range(rng, 0.9, 1.1))}</g>`)
    .join('');
  const rings = [34, 64, 94]
    .map(
      (r, i) =>
        `<ellipse class="ring" cx="170" cy="205" rx="${r}" ry="${r * 0.46}" fill="none" stroke="${HEX.verified}" stroke-width="${3 - i * 0.6}" stroke-opacity="${1 - i * 0.25}"/>`,
    )
    .join('');
  const pin =
    fan(
      [
        [170, 205],
        [148, 163],
        [147, 145],
        [156, 129],
        [170, 122],
        [184, 129],
        [193, 145],
        [192, 163],
      ],
      [170, 151],
      ramp(HEX.leafDark, HEX.verified),
    ) + `<circle cx="170" cy="147" r="8" fill="#FFFFFF"/>`;
  const panel = (x) =>
    `<rect x="${x}" y="38" width="34" height="20" fill="#3E6D8C"/>` +
    `<path d="M${x + 11},38 V58 M${x + 23},38 V58 M${x},48 H${x + 34}" stroke="#9CC3D9" stroke-width="1.2"/>`;
  const satellite =
    `<g class="sat">${panel(218)}${panel(278)}` +
    `<path d="M252,48 H278" stroke="#5B6560" stroke-width="2"/>` +
    fan(
      [
        [265, 34],
        [278, 48],
        [265, 62],
        [252, 48],
      ],
      [265, 48],
      ramp('#8C948F', '#E6E8E4'),
    ) +
    `<circle cx="265" cy="66" r="3.5" fill="${HEX.flagged}"/></g>`;
  const beam = `<polygon class="beam" points="265,66 138,205 202,205" fill="${HEX.verified}" opacity="0"/>`;
  return svg(
    '0 0 340 300',
    `${beam}<g class="tile">${tile}${trees}</g>${rings}<g class="pin">${pin}</g>${satellite}`,
    'tc-field',
  );
}

export function fieldCheckTimeline(root, gsap) {
  const rings = root.querySelectorAll('.ring');
  const beam = root.querySelector('.beam');
  return gsap
    .timeline({ paused: true })
    .from(root.querySelector('.tile'), { y: 30, opacity: 0, duration: 0.2, ease: 'power3.out' }, 0)
    .from(
      root.querySelectorAll('.tree'),
      { scale: 0, transformOrigin: '50% 100%', stagger: 0.02, duration: 0.12, ease: 'back.out(2)' },
      0.12,
    )
    .from(
      root.querySelector('.sat'),
      { x: 90, y: -50, opacity: 0, duration: 0.25, ease: 'power2.out' },
      0.15,
    )
    .fromTo(
      beam,
      { opacity: 0, scaleY: 0, svgOrigin: '265 66' },
      { opacity: 0.22, scaleY: 1, svgOrigin: '265 66', duration: 0.12, ease: 'power2.out' },
      0.4,
    )
    .to(beam, { opacity: 0.1, duration: 0.06, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0.52)
    .from(
      root.querySelector('.pin'),
      { y: -90, opacity: 0, duration: 0.25, ease: 'bounce.out' },
      0.48,
    )
    .fromTo(
      rings,
      { drawSVG: '50% 50%', opacity: 0 },
      { drawSVG: '0% 100%', opacity: 1, stagger: 0.06, duration: 0.18, ease: 'power2.out' },
      0.66,
    )
    .set({}, {}, 1);
}
