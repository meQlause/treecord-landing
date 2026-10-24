// Field check: an isometric forest tile, a satellite sweeping it, the pin drops and the GPS rings lock.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32, within } from '../random';
import { fan, point, poly, ramp, rows, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

const SEED = 71;
const TAPER = 0.36;
const HEIGHT_JITTER = { min: 0.9, max: 1.1 };
const GRID = { left: 30, right: 170, span: 140, middle: 205, rise: 65, bottom: 270, top: 140 };
const GRID_STEPS = rows('0.25 0.5 0.75').flat();
const TREES = rows('90,205,26 118,186,22 236,196,28 262,214,22 210,236,24 120,232,20');
const RINGS = rows('34 64 94').flat();
const RING = { squash: 0.46, width: 3, widthStep: 0.6, fadeStep: 0.25 };
const PANELS = rows('218 278').flat();
const PANEL = { near: 11, far: 23, width: 34 };

interface Cone {
  x: number;
  y: number;
  height: number;
}

const cone = ({ x: posX, y: posY, height }: Cone): string =>
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

const panel = (posX: number): string =>
  `<rect x="${posX}" y="38" width="${PANEL.width}" height="20" fill="#3E6D8C"/>` +
  `<path d="M${posX + PANEL.near},38 V58 M${posX + PANEL.far},38 V58 M${posX},48 H${posX + PANEL.width}" stroke="#9CC3D9" stroke-width="1.2"/>`;

const gridLine = (step: number): string => {
  const lowerFrom = [GRID.left + GRID.span * step, GRID.middle - GRID.rise * step];
  const lowerTo = [GRID.right + GRID.span * step, GRID.bottom - GRID.rise * step];
  const upperFrom = [GRID.left + GRID.span * step, GRID.middle + GRID.rise * step];
  const upperTo = [GRID.right + GRID.span * step, GRID.top + GRID.rise * step];

  return `<path d="M${lowerFrom} L${lowerTo} M${upperFrom} L${upperTo}" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5"/>`;
};

/** An isometric tile of forest; a satellite sweeps it (vegetation check), the pin drops and the GPS rings lock. */
export function fieldCheckSVG(): string {
  const rng = mulberry32(SEED);
  const tile =
    fan('170,140 310,205 170,270 30,205', point('170,205'), ramp(HEX.grassDark, HEX.grassLight)) +
    poly('30,205 170,270 170,290 30,225', HEX.soilLight) +
    poly('170,270 310,205 310,225 170,290', HEX.soil) +
    GRID_STEPS.map(gridLine).join('');
  const trees = TREES.map(
    ([posX, posY, height]) =>
      `<g class="tree">${cone({ x: posX, y: posY, height: height * within(rng, HEIGHT_JITTER) })}</g>`,
  ).join('');
  const rings = RINGS.map(
    (radius, index) =>
      `<ellipse class="ring" cx="170" cy="205" rx="${radius}" ry="${radius * RING.squash}" fill="none" stroke="${HEX.verified}" stroke-width="${RING.width - index * RING.widthStep}" stroke-opacity="${1 - index * RING.fadeStep}"/>`,
  ).join('');
  const pin =
    fan(
      '170,205 148,163 147,145 156,129 170,122 184,129 193,145 192,163',
      point('170,151'),
      ramp(HEX.leafDark, HEX.verified),
    ) + `<circle cx="170" cy="147" r="8" fill="#FFFFFF"/>`;
  const satellite =
    `<g class="sat">${PANELS.map(panel).join('')}` +
    `<path d="M252,48 H278" stroke="#5B6560" stroke-width="2"/>` +
    fan('265,34 278,48 265,62 252,48', point('265,48'), ramp('#8C948F', '#E6E8E4')) +
    `<circle cx="265" cy="66" r="3.5" fill="${HEX.flagged}"/></g>`;
  const beam = `<polygon class="beam" points="265,66 138,205 202,205" fill="${HEX.verified}" opacity="0"/>`;

  return svg(
    '0 0 340 300',
    `${beam}<g class="tile">${tile}${trees}</g>${rings}<g class="pin">${pin}</g>${satellite}`,
    'tc-field',
  );
}

const WHEN = { trees: 0.12, satellite: 0.15, beam: 0.4, flicker: 0.52, pin: 0.48, rings: 0.66 };
const SATELLITE_ORIGIN = '265 66';

export function fieldCheckTimeline(root: Element): Timeline {
  const beam = pick(root, '.beam');
  const timeline = paused();
  timeline
    .from(pick(root, '.tile'), { y: 30, opacity: 0, duration: 0.2, ease: EASE.strongOut }, 0)
    .from(
      root.querySelectorAll('.tree'),
      { scale: 0, transformOrigin: '50% 100%', stagger: 0.02, duration: 0.12, ease: 'back.out(2)' },
      WHEN.trees,
    )
    .from(
      pick(root, '.sat'),
      { x: 90, y: -50, opacity: 0, duration: 0.25, ease: EASE.out },
      WHEN.satellite,
    )
    .fromTo(
      beam,
      { opacity: 0, scaleY: 0, svgOrigin: SATELLITE_ORIGIN },
      { opacity: 0.22, scaleY: 1, svgOrigin: SATELLITE_ORIGIN, duration: 0.12, ease: EASE.out },
      WHEN.beam,
    )
    .to(
      beam,
      { opacity: 0.1, duration: 0.06, yoyo: true, repeat: 5, ease: EASE.soft },
      WHEN.flicker,
    )
    .from(pick(root, '.pin'), { y: -90, opacity: 0, duration: 0.25, ease: 'bounce.out' }, WHEN.pin)
    .fromTo(
      root.querySelectorAll('.ring'),
      { drawSVG: '50% 50%', opacity: 0 },
      { drawSVG: '0% 100%', opacity: 1, stagger: 0.06, duration: 0.18, ease: EASE.out },
      WHEN.rings,
    );

  return settle(timeline);
}
