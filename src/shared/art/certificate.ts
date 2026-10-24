// Carbon market trust gap: the certificate cracks and its price tag drops.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32 } from '../random';
import { blob, fan, parse, point, poly, ramp, rows, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

const SEED = 41;
const CRACK = parse('134,20 124,70 140,118 122,170 142,222 128,268 136,300');
const TEXT_LINES = rows('84 100 116 140 156 172 196 212').flat();
const SHORT = { every: 3, which: 2, share: 0.6 };
const PAPER = ramp('#E4DFD2', '#FFFFFF');
const BAR_FILL = '#D3D1C7';

interface Bar {
  x: number;
  y: number;
  width: number;
  height?: number;
}

const bar = ({ x: posX, y: posY, width, height = 7 }: Bar, fill = BAR_FILL): string =>
  `<rect x="${posX}" y="${posY}" width="${width}" height="${height}" rx="3.5" fill="${fill}"/>`;

const lines = ({ left, width }: { left: number; width: number }): string =>
  TEXT_LINES.map((rowY, index) =>
    bar({
      x: left,
      y: rowY,
      width: width * (index % SHORT.every === SHORT.which ? SHORT.share : 1),
    }),
  ).join('');

export function certificateSVG(): string {
  const left =
    fan([point('20,20'), ...CRACK, point('20,300')], point('72,160'), PAPER) +
    bar({ x: 40, y: 44, width: 74, height: 12 }, HEX.primary) +
    lines({ left: 40, width: 70 });
  const seal =
    blob(
      mulberry32(SEED),
      { x: 194, y: 250, r: 24 },
      { sides: 8, squash: 1, palette: ramp(HEX.leafDark, HEX.verified), gradient: false },
    ) +
    poly('182,268 176,296 188,288 194,300', HEX.leafDark) +
    poly('206,268 212,296 200,288 194,300', HEX.primary);
  const right =
    fan([...CRACK, point('240,300'), point('240,20')], point('190,160'), PAPER) +
    bar({ x: 156, y: 44, width: 50, height: 12 }, HEX.primary) +
    lines({ left: 156, width: 64 }) +
    `<g class="seal">${seal}</g>`;
  const crack = `<path class="crack" d="M${CRACK.map((corner) => corner.join(',')).join(' L')}" fill="none" stroke="${HEX.text}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  // the price tag hangs off the top-right corner; its arrow points down (a credit sold at a discount)
  const tag =
    `<g class="pricetag" opacity="0"><path d="M238,22 L280,68" stroke="#B9B5AA" stroke-width="2"/>` +
    fan('280,58 302,76 302,132 258,132 258,76', point('280,98'), PAPER) +
    `<circle cx="280" cy="72" r="4" fill="${HEX.bg}" stroke="#CFCBC0" stroke-width="1.5"/>` +
    `<path class="down" d="M280,88 L280,118 M270,108 L280,120 L290,108" fill="none" stroke="${HEX.flagged}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;

  return svg(
    '0 0 312 320',
    `<g class="half left">${left}</g><g class="half right">${right}</g>${crack}${tag}`,
    'tc-certificate',
  );
}

const WHEN = { crack: 0.2, split: 0.62, seal: 0.65, tag: 0.7, arrow: 0.86 };
const GREY = '#A5ABA7';

export function certificateTimeline(root: Element): Timeline {
  const timeline = paused();
  timeline
    .from(root.querySelectorAll('.half'), { y: 30, opacity: 0, duration: 0.2, ease: EASE.out }, 0)
    .fromTo(
      pick(root, '.crack'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.4, ease: 'power1.in' },
      WHEN.crack,
    )
    .to(
      pick(root, '.left'),
      { rotation: -6, x: -8, svgOrigin: '20 300', duration: 0.35, ease: EASE.out },
      WHEN.split,
    )
    .to(
      pick(root, '.right'),
      { rotation: 6, x: 8, svgOrigin: '240 300', duration: 0.35, ease: EASE.out },
      WHEN.split,
    )
    .to(
      root.querySelectorAll('.seal polygon'),
      { fill: GREY, stroke: GREY, duration: 0.3 },
      WHEN.seal,
    )
    .fromTo(
      pick(root, '.pricetag'),
      { opacity: 0, rotation: -70, svgOrigin: '238 22' },
      { opacity: 1, rotation: 0, svgOrigin: '238 22', duration: 0.25, ease: 'elastic.out(1, 0.5)' },
      WHEN.tag,
    )
    .fromTo(
      pick(root, '.down'),
      { y: -6 },
      { y: 4, duration: 0.06, yoyo: true, repeat: 3, ease: EASE.soft },
      WHEN.arrow,
    );

  return settle(timeline);
}
