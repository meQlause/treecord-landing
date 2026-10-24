// Planter phone (signed video proof).
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32 } from '../random';
import { MONO, blob, fan, leaf, limb, mix, point, ramp, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

/** Sample proof values. Illustrative only. */
export const PROOF_ROWS = [
  'GPS  -6.5924, 106.7969  ±8 m',
  'TIME 2026-10-20 07:42:13',
  'SIG  0x9f3a…c21e  verified',
];

/** Screen-area crop, for a viewBox zoom from the whole phone into the proof on its screen. */
export const PHONE_SCREEN_VIEWBOX = '30 120 260 488'; // same aspect as the whole phone (0 0 320 600), so the zoom never letterboxes

const SEED = 51;
const TILT = 0.45;
const SPROUT_MIX = 0.55;
const LEAF = { length: 48, width: 18 };
const BRACKETS = [
  'M60,240 L60,210 L90,210',
  'M260,240 L260,210 L230,210',
  'M60,380 L60,410 L90,410',
  'M260,380 L260,410 L230,410',
];
const ROW = { first: 466, step: 20 };
const BODY = ramp('#121517', '#3A403C');

export function phoneSVG({ rows: proof = PROOF_ROWS }: { rows?: string[] } = {}): string {
  const rng = mulberry32(SEED);
  const shade = mix(HEX.sprout, HEX.leafMid, SPROUT_MIX);
  const body = fan(
    '34,10 286,10 310,34 310,566 286,590 34,590 10,566 10,34',
    point('160,300'),
    BODY,
  );
  const scene =
    `<rect x="24" y="40" width="272" height="520" fill="${HEX.primarySoft}"/>` +
    blob(
      rng,
      { x: 160, y: 520, r: 230 },
      { sides: 9, squash: 0.42, palette: ramp(HEX.grassDark, HEX.grassLight) },
    ) +
    blob(
      rng,
      { x: 160, y: 392, r: 70 },
      { sides: 8, squash: 0.2, palette: ramp(HEX.soil, HEX.soilLight), gradient: false },
    ) +
    limb({
      from: point('160,392'),
      to: point('160,330'),
      width: { start: 7, end: 4 },
      rng,
      segments: 2,
    }) +
    leaf(point('160,332'), { ...LEAF, angle: Math.PI + TILT }, shade, HEX.sprout) +
    leaf(point('160,332'), { ...LEAF, angle: -TILT }, HEX.sprout, shade);
  const brackets = BRACKETS.map(
    (path) =>
      `<path class="bracket" d="${path}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`,
  ).join('');
  const rec = `<g class="rec"><circle cx="50" cy="70" r="6" fill="${HEX.flagged}"/><text x="62" y="75" ${MONO} font-size="13" font-weight="700" fill="${HEX.text}">REC</text></g>`;
  const panel =
    `<rect class="panel" x="38" y="440" width="244" height="78" rx="10" fill="#FFFFFF" fill-opacity="0.9" stroke="${HEX.verified}" stroke-opacity="0" stroke-width="2"/>` +
    proof
      .map(
        (text, index) =>
          `<text class="row" data-text="${text}" x="52" y="${ROW.first + index * ROW.step}" ${MONO} font-size="11" fill="${HEX.text}"></text>`,
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

const WHEN = { brackets: 0.15, rec: 0.2, firstRow: 0.38, rowStep: 0.15, panel: 0.86 };

export function phoneTimeline(root: Element): Timeline {
  const timeline = paused();
  timeline
    .from(pick(root, '.phone'), { y: 80, opacity: 0, duration: 0.2, ease: EASE.out }, 0)
    .from(
      root.querySelectorAll('.bracket'),
      { scale: 1.35, opacity: 0, svgOrigin: '160 310', duration: 0.15, ease: EASE.out },
      WHEN.brackets,
    )
    .to(
      pick(root, '.rec circle'),
      { opacity: 0.15, duration: 0.05, repeat: 11, yoyo: true, ease: EASE.none },
      WHEN.rec,
    );
  root.querySelectorAll<SVGElement>('.row').forEach((row, index) => {
    timeline.to(
      row,
      {
        duration: 0.14,
        ease: EASE.none,
        scrambleText: { text: row.dataset.text ?? '', chars: '0123456789abcdef', speed: 1 },
      },
      WHEN.firstRow + index * WHEN.rowStep,
    );
  });
  timeline.to(pick(root, '.panel'), { attr: { 'stroke-opacity': 1 }, duration: 0.08 }, WHEN.panel);

  return settle(timeline);
}
