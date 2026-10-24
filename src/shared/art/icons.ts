// 64 x 64 faceted icons: 4 pipeline nodes + 5 roles. Same light direction and palette as everything else.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32 } from '../random';
import { blob, fan, leaf, mix, point, poly, ramp, svg, type Point } from './lowpoly';
import { paused, settle, type Timeline } from './timeline';

const GREEN = ramp(HEX.leafDark, HEX.leafLight);
const WHITE = '#FFFFFF';
const HALF = 0.5;
const SEEDS = { donor: 71, planter: 72 };
const POP_AT = 0.1;
const TAPER = 0.38;
const COIN_SIDES = 8;
const TICK = { left: 0.45, mid: 0.1, drop: 0.35, right: 0.5, width: 0.28 };
const PLANT = { sprout: 0.55, tilt: 0.5 };
const GOLD = ['#A8741F', '#F4D27A'];
const SCAN = [
  'M8,20 L8,8 L20,8',
  'M44,8 L56,8 L56,20',
  'M8,44 L8,56 L20,56',
  'M56,44 L56,56 L44,56',
];

interface Disc {
  x: number;
  y: number;
  r: number;
}

const check = ({ x: posX, y: posY, r: radius }: Disc): string =>
  `<circle cx="${posX}" cy="${posY}" r="${radius}" fill="${HEX.verified}" stroke="#FFFFFF" stroke-width="2"/>` +
  `<path d="M${posX - radius * TICK.left},${posY} L${posX - radius * TICK.mid},${posY + radius * TICK.drop} L${posX + radius * TICK.right},${posY - radius * TICK.drop}" fill="none" stroke="#FFFFFF" stroke-width="${radius * TICK.width}" stroke-linecap="round" stroke-linejoin="round"/>`;

const tree = ({ x: posX, y: posY, h: height }: { x: number; y: number; h: number }): string =>
  poly(
    [
      [posX, posY - height],
      [posX + height * TAPER, posY],
      [posX, posY],
    ],
    HEX.leafLight,
  ) +
  poly(
    [
      [posX, posY - height],
      [posX, posY],
      [posX - height * TAPER, posY],
    ],
    HEX.leafMid,
  );

const coin = ({ x: posX, y: posY, r: radius }: Disc, dark: string, light: string): string =>
  fan(
    Array.from({ length: COIN_SIDES }, (_item, index): Point => [
      posX + Math.cos((index / COIN_SIDES) * Math.PI * 2) * radius,
      posY + Math.sin((index / COIN_SIDES) * Math.PI * 2) * radius,
    ]),
    [posX, posY],
    ramp(dark, light),
  );

const sproutShade = mix(HEX.sprout, HEX.leafMid, PLANT.sprout);
const glass = mix(WHITE, HEX.leafLight, HALF);

export const ICONS = {
  // pipeline nodes (B4)
  video: () =>
    poly('8,18 44,18 8,46', HEX.leafMid) +
    poly('44,18 44,46 8,46', HEX.leafDark) +
    poly('46,26 58,18 58,32', HEX.leafLight) +
    poly('46,26 58,32 58,46 46,38', HEX.leafMid) +
    `<circle cx="16" cy="25" r="3.2" fill="${HEX.flagged}"/>`,
  ai: () =>
    SCAN.map(
      (path) =>
        `<path d="${path}" fill="none" stroke="${HEX.leafDark}" stroke-width="4" stroke-linecap="round"/>`,
    ).join('') +
    fan('32,14 44,32 32,50 20,32', point('32,32'), GREEN) +
    `<rect class="scan" x="12" y="31" width="40" height="2.5" rx="1.25" fill="${HEX.pending}"/>`,
  donor: () =>
    blob(
      mulberry32(SEEDS.donor),
      { x: 30, y: 21, r: 10 },
      { sides: 6, squash: 1, palette: GREEN, gradient: false },
    ) +
    poly('12,56 18,37 30,34 30,56', HEX.leafDark) +
    poly('30,34 42,37 48,56 30,56', HEX.leafMid) +
    check({ x: 47, y: 45, r: 9 }),
  chain: () =>
    poly('32,10 54,22 32,34 10,22', HEX.leafLight) +
    poly('10,22 32,34 32,58 10,46', HEX.leafMid) +
    poly('32,34 54,22 54,46 32,58', HEX.leafDark) +
    leaf(point('26,24'), { length: 12, width: 6, angle: -0.5 }, WHITE, glass),

  // roles (B7)
  donorRole: () =>
    fan(
      '32,56 10,33 9,21 17,12 26,12 32,19 38,12 47,12 55,21 54,33',
      point('32,30'),
      ramp('#8E3A2A', '#E07A5F'),
    ) + coin({ x: 50, y: 50, r: 9 }, GOLD[0], GOLD[1]),
  planter: () =>
    blob(
      mulberry32(SEEDS.planter),
      { x: 32, y: 52, r: 22 },
      { sides: 8, squash: 0.28, palette: ramp(HEX.soil, HEX.soilLight), gradient: false },
    ) +
    poly('30.5,50 33.5,50 33,30 31,30', HEX.bark) +
    leaf(
      point('32,32'),
      { length: 20, width: 10, angle: Math.PI + PLANT.tilt },
      sproutShade,
      HEX.sprout,
    ) +
    leaf(point('32,30'), { length: 22, width: 11, angle: -0.55 }, HEX.sprout, sproutShade),
  developer: () =>
    poly('32,28 58,41 32,54 6,41', HEX.grassLight) +
    poly('6,41 32,54 32,59 6,46', HEX.soilLight) +
    poly('32,54 58,41 58,46 32,59', HEX.soil) +
    tree({ x: 22, y: 42, h: 18 }) +
    tree({ x: 34, y: 36, h: 22 }) +
    tree({ x: 42, y: 46, h: 16 }),
  verifier: () =>
    fan('32,6 54,14 52,36 32,58 12,36 10,14', point('32,30'), GREEN) +
    `<circle cx="30" cy="28" r="9" fill="none" stroke="#FFFFFF" stroke-width="4"/><path d="M37,35 L45,43" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>`,
  buyer: () =>
    coin({ x: 28, y: 30, r: 20 }, HEX.leafDark, HEX.leafLight) +
    leaf(point('20,38'), { length: 18, width: 9, angle: -0.85 }, WHITE, glass) +
    poly('42,40 58,40 58,58 50,52 42,58', HEX.pending),
};

export type IconName = keyof typeof ICONS;

export const iconSVG = (name: IconName): string =>
  svg('0 0 64 64', `<g class="icon">${ICONS[name]()}</g>`, `tc-icon tc-icon--${name}`);

const ICON_ORIGIN = '32 32';

/** Icon pops in, its facets settle with a small stagger. */
export function iconTimeline(root: Element): Timeline {
  const timeline = paused();
  timeline
    .fromTo(
      pick(root, '.icon'),
      { scale: 0, rotation: -12, svgOrigin: ICON_ORIGIN },
      { scale: 1, rotation: 0, svgOrigin: ICON_ORIGIN, duration: 0.5, ease: 'back.out(1.9)' },
      0,
    )
    .from(
      root.querySelectorAll('.icon > polygon'),
      { opacity: 0, stagger: 0.02, duration: 0.2 },
      POP_AT,
    );

  return settle(timeline);
}
