// Signature seal (the proof is locked).
import { pick } from '../dom';
import { HEX } from '../palette';
import { fan, point, ramp, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

export function shieldSVG(): string {
  const body = fan(
    '60,8 104,22 100,72 60,128 20,72 16,22',
    point('60,60'),
    ramp(HEX.leafDark, HEX.verified),
  );
  const check = `<path class="check" d="M38,66 L54,82 L84,48" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;

  return svg('0 0 120 140', `<g class="shield">${body}${check}</g>`, 'tc-shield');
}

const CHECK_AT = 0.45;

export function shieldTimeline(root: Element): Timeline {
  const timeline = paused();
  timeline
    .fromTo(
      pick(root, '.shield'),
      { scale: 0, rotation: -20, svgOrigin: '60 70' },
      { scale: 1, rotation: 0, svgOrigin: '60 70', duration: 0.45, ease: 'back.out(1.8)' },
      0,
    )
    .fromTo(
      pick(root, '.check'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.35, ease: EASE.out },
      CHECK_AT,
    );

  return settle(timeline);
}
