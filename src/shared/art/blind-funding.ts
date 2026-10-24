// Donors fund blindly: coins fly from a donor's phone into fog.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32 } from '../random';
import { coinSVG } from './coin';
import { blob, fan, nest, parse, point, ramp, rows, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

const SEED = 31;
const COIN_COUNT = 3;
const COIN_BOX = { x: 43, y: 93, width: 34, height: 34 };
const CLOUD = rows('262,118,46 312,96,58 356,118,44 290,138,40 336,140,40');
const MARKS = parse('262,46 312,30 358,54');
const HEAD_FONT = 'font-family="Plus Jakarta Sans, system-ui, sans-serif"';
const MIDDLE = 0.5;

export function blindFundingSVG(): string {
  const rng = mulberry32(SEED);
  const phone =
    fan(
      '22,70 74,70 80,78 80,196 74,204 22,204 16,196 16,78',
      point('48,136'),
      ramp('#121517', '#3A403C'),
    ) +
    `<rect x="22" y="80" width="52" height="112" rx="6" fill="${HEX.primarySoft}"/>` +
    fan(
      '48,152 34,138 34,128 40,122 46,122 48,126 50,122 56,122 62,128 62,138',
      point('48,134'),
      ramp('#8E3A2A', '#E07A5F'),
    );
  const arc = `<path class="arc" d="M60,110 C120,10 220,10 272,96" fill="none" stroke="#C9C6BC" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;
  const cloud = CLOUD.map(([posX, posY, radius]) =>
    blob(
      rng,
      { x: posX, y: posY, r: radius },
      { palette: ramp('#D6D2C7', '#FFFFFF'), squash: 0.8 },
    ),
  ).join('');
  // three coins wait at the start of the arc (60, 110); MotionPath carries them into the cloud
  const coins = Array.from({ length: COIN_COUNT }, () => nest(coinSVG(), COIN_BOX, 'coin')).join(
    '',
  );
  const marks = MARKS.map(
    ([posX, posY]) =>
      `<text class="q" x="${posX}" y="${posY}" text-anchor="middle" ${HEAD_FONT} font-weight="800" font-size="34" fill="${HEX.muted}" opacity="0">?</text>`,
  ).join('');

  return svg(
    '0 0 400 220',
    `<g class="donor">${phone}</g>${arc}<g class="coins">${coins}</g><g class="cloud">${cloud}</g>${marks}`,
    'tc-blind',
  );
}

const WHEN = {
  cloud: 0.05,
  arc: 0.12,
  firstCoin: 0.24,
  coinStep: 0.12,
  vanish: 0.26,
  pulse: 0.55,
  marks: 0.74,
};

export function blindFundingTimeline(root: Element): Timeline {
  const arc = pick<SVGPathElement>(root, '.arc');
  const cloud = pick(root, '.cloud');
  const timeline = paused();
  timeline
    .from(pick(root, '.donor'), { x: -30, opacity: 0, duration: 0.15, ease: EASE.out }, 0)
    .from(cloud, { x: 40, opacity: 0, duration: 0.25, ease: EASE.out }, WHEN.cloud)
    .from(arc, { opacity: 0, duration: 0.12 }, WHEN.arc); // fade, not DrawSVG: DrawSVG would replace the dotted dash pattern
  root.querySelectorAll('[data-nest=coin]').forEach((coin, index) => {
    const start = WHEN.firstCoin + index * WHEN.coinStep;
    timeline
      .fromTo(coin, { opacity: 0 }, { opacity: 1, duration: 0.03 }, start)
      .to(
        coin,
        {
          motionPath: { path: arc, align: arc, alignOrigin: [MIDDLE, MIDDLE] },
          duration: 0.3,
          ease: 'power1.in',
        },
        start,
      )
      .to(
        coin,
        { opacity: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.06 },
        start + WHEN.vanish,
      );
  });
  timeline
    .to(
      cloud,
      {
        scale: 1.05,
        transformOrigin: '50% 50%',
        duration: 0.05,
        yoyo: true,
        repeat: 3,
        ease: EASE.soft,
      },
      WHEN.pulse,
    )
    .fromTo(
      root.querySelectorAll('.q'),
      { opacity: 0, y: 14, scale: 0.6, transformOrigin: '50% 100%' },
      { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.12, ease: 'back.out(2.5)' },
      WHEN.marks,
    );

  return settle(timeline);
}
