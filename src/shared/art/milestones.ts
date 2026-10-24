// The 36-month milestone track (B5): when each payout falls due, and how much of the incentive it is.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32 } from '../random';
import { coinSVG } from './coin';
import { MONO, blob, nest, ramp, svg } from './lowpoly';
import { EASE, paused, type Timeline } from './timeline';

/** PRODUCT_KNOWLEDGE.md §3: due months and share of the per-tree incentive. */
const MILESTONES = [
  { month: 0, share: 10 },
  { month: 3, share: 10 },
  { month: 6, share: 10 },
  { month: 12, share: 15 },
  { month: 24, share: 15 },
  { month: 36, share: 40 },
];
const SEED = 91;
const MONTHS = 36;
const TRACK = { left: 100, right: 1100, baseline: 180 };
const COIN = { base: 46, shareUnit: 10, lift: 34 };
const LABEL_DROP = 44;
const DOT = { reach: 15, sides: 7 };
const LAST_AT = 0.93;

// true time scale, so 24 -> 36 looks as long as it is
const xAt = (month: number): number => TRACK.left + (month / MONTHS) * (TRACK.right - TRACK.left);

export function milestonesSVG(): string {
  const rng = mulberry32(SEED);
  const { left, right, baseline } = TRACK;
  const line = `d="M${left},${baseline} L${right},${baseline}"`;
  const base = `<path ${line} stroke="#D3D0C6" stroke-width="6" stroke-linecap="round"/>`;
  const progress = `<path class="progress" ${line} stroke="${HEX.verified}" stroke-width="6" stroke-linecap="round"/>`;
  const marks = MILESTONES.map(({ month, share }) => {
    const posX = xAt(month);
    const size = COIN.base * Math.sqrt(share / COIN.shareUnit); // coin area tracks the payout share
    const dot = { x: posX, y: baseline, r: DOT.reach };
    const off = blob(rng, dot, {
      sides: DOT.sides,
      squash: 1,
      palette: ramp('#C9C6BC', '#F2F0EA'),
      gradient: false,
    });
    const glow = blob(rng, dot, {
      sides: DOT.sides,
      squash: 1,
      palette: ramp(HEX.leafDark, HEX.leafLight),
      gradient: false,
    });
    const box = { x: posX - size / 2, y: baseline - COIN.lift - size, width: size, height: size };
    const label = `${month}${month === MONTHS ? ' mo' : ''}`;

    return (
      `<g class="milestone" data-at="${month / MONTHS}" data-x="${posX}">` +
      off +
      `<g class="dot-on" opacity="0">${glow}</g>` +
      nest(coinSVG(), box, 'coin') +
      `<text x="${posX}" y="${baseline + LABEL_DROP}" text-anchor="middle" ${MONO} font-size="15" fill="${HEX.muted}">${label}</text>` +
      `</g>`
    );
  }).join('');

  return svg('0 0 1200 260', `${base}${progress}${marks}`, 'tc-milestones');
}

/** Progress 0..1 = month 0..36. Each milestone lights and pays its coin when the line reaches it. */
export function milestonesTimeline(root: Element): Timeline {
  const timeline = paused({ defaults: { ease: EASE.none } });
  timeline.fromTo(pick(root, '.progress'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0);
  root.querySelectorAll<SVGElement>('.milestone').forEach((milestone) => {
    const start = Math.min(Number(milestone.dataset.at), LAST_AT);
    timeline
      .to(pick(milestone, '.dot-on'), { opacity: 1, duration: 0.03 }, start)
      .fromTo(
        pick(milestone, '[data-nest=coin]'),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.07, ease: 'back.out(2)' },
        start,
      );
  });

  return timeline;
}
