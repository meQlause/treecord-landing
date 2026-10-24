// Registry serial tag (B6).
import { pick } from '../dom';
import { HEX } from '../palette';
import { MONO, fan, point, poly, ramp, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

interface SerialOptions {
  meta?: string;
  serial?: string;
}

/** Sample registry values. Illustrative only. */
export function serialSVG({
  meta = 'SRN PPI · VINTAGE 2026 · 1 tCO₂e',
  serial = 'IDN-2026-000123',
}: SerialOptions = {}): string {
  const body =
    fan('44,10 370,10 370,120 44,120 8,65', point('190,65'), ramp('#E4DFD2', '#FFFFFF')) +
    poly('44,10 54,10 54,120 44,120', HEX.primary) +
    `<circle cx="30" cy="65" r="7" fill="${HEX.bg}" stroke="#CFCBC0" stroke-width="2"/>` +
    `<text x="72" y="48" ${MONO} font-size="13" fill="${HEX.muted}">${meta}</text>` +
    `<text class="serial" data-text="${serial}" x="72" y="90" ${MONO} font-size="24" font-weight="700" fill="${HEX.primary}">${serial.replace(/./g, '·')}</text>`;

  return svg('0 0 380 130', `<g class="tag">${body}</g>`, 'tc-serial');
}

const SCRAMBLE_AT = 0.25;

export function serialTimeline(root: Element): Timeline {
  const serial = pick<SVGElement>(root, '.serial');
  const timeline = paused();
  timeline
    .from(pick(root, '.tag'), { x: -60, opacity: 0, duration: 0.25, ease: EASE.strongOut }, 0)
    .to(
      serial,
      {
        duration: 0.55,
        ease: EASE.none,
        scrambleText: { text: serial.dataset.text ?? '', chars: '0123456789ABCDEF-', speed: 0.6 },
      },
      SCRAMBLE_AT,
    );

  return settle(timeline);
}
