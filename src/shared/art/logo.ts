// The logo mark: a faceted tree with a verified badge.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32, within } from '../random';
import { parse, point, poly, ramp, shadeFaces, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

const SEED = 61;
const CROWN = [
  '32,5 44,25 20,25',
  '20,25 32,45 8,45',
  '44,25 56,45 32,45',
  '20,25 44,25 32,45',
].map(parse);
const SCATTER = {
  x: { min: -40, max: 40 },
  y: { min: -40, max: 20 },
  turn: { min: -120, max: 120 },
};
const WHEN = { trunk: 0.1, badge: 0.62, check: 0.82 };

export function logoSVG(): string {
  const body =
    shadeFaces(CROWN, point('32,30'), ramp(HEX.leafDark, HEX.leafLight), {
      attrs: 'class="facet"',
    }) +
    `<g class="trunk">${poly('29,45 32,45 32,58 29,58', HEX.bark)}${poly('32,45 35,45 35,58 32,58', HEX.barkLight)}</g>` +
    `<g class="badge"><circle cx="49" cy="49" r="10" fill="${HEX.verified}" stroke="${HEX.bg}" stroke-width="2.5"/>` +
    `<path class="check" d="M44.5,49 L48,52.5 L54,45.5" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;

  return svg('0 0 64 64', body, 'tc-logo');
}

export function logoTimeline(root: Element): Timeline {
  const rng = mulberry32(SEED);
  const timeline = paused();
  timeline
    .from(
      root.querySelectorAll('.facet'),
      {
        x: () => within(rng, SCATTER.x),
        y: () => within(rng, SCATTER.y),
        rotation: () => within(rng, SCATTER.turn),
        opacity: 0,
        transformOrigin: '50% 50%',
        stagger: 0.08,
        duration: 0.45,
        ease: EASE.strongOut,
      },
      0,
    )
    .from(
      pick(root, '.trunk'),
      { scaleY: 0, svgOrigin: '32 58', duration: 0.25, ease: EASE.out },
      WHEN.trunk,
    )
    .from(
      pick(root, '.badge'),
      { scale: 0, svgOrigin: '49 49', duration: 0.25, ease: 'back.out(2)' },
      WHEN.badge,
    )
    .fromTo(
      pick(root, '.badge .check'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.15 },
      WHEN.check,
    );

  return settle(timeline);
}
