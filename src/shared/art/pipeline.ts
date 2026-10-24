// The proof pipeline (B4): video -> AI check -> donor -> chain, as one drawn path with a token riding it.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32 } from '../random';
import { coinSVG } from './coin';
import { iconSVG, type IconName } from './icons';
import { blob, fan, nest, point, ramp, rows, svg, type Point } from './lowpoly';
import { EASE, paused, type Timeline } from './timeline';

const NODES: { icon: IconName; at: Point }[] = [
  { icon: 'video', at: point('200,190') },
  { icon: 'ai', at: point('600,130') },
  { icon: 'donor', at: point('1000,210') },
  { icon: 'chain', at: point('1400,140') },
];
const SEED = 81;
const SMOOTH = 6;
const TAPER = 0.36;
const NODE = { reach: 62, ring: 66, half: 34, size: 68 };
const ISLAND = { drop: 70, reach: 64, half: 20, full: 40, thick: 12, bottom: 52 };
const ISLAND_TREES = [
  { dx: -40, dy: 24, height: 22 },
  { dx: 42, dy: 22, height: 18 },
];
const PAYOUT = rows('60,-70 100,-30 120,-84');
const PAYOUT_COIN = { half: 18, size: 36 };
const GEM = { reach: 18, sides: 6, lift: -3 };

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(points: Point[]): string {
  let path = `M${points[0].join(',')}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[index - 1] ?? points[index];
    const [from, to] = [points[index], points[index + 1]];
    const after = points[index + 2] ?? to;
    const first = [from[0] + (to[0] - before[0]) / SMOOTH, from[1] + (to[1] - before[1]) / SMOOTH];
    const second = [to[0] - (after[0] - from[0]) / SMOOTH, to[1] - (after[1] - from[1]) / SMOOTH];
    path += ` C${first.map(Math.round).join(',')} ${second.map(Math.round).join(',')} ${to.join(',')}`;
  }

  return path;
}

const tree = (posX: number, posY: number, height: number): string =>
  `<polygon points="${posX},${posY - height} ${posX + height * TAPER},${posY} ${posX},${posY}" fill="${HEX.leafLight}"/><polygon points="${posX},${posY - height} ${posX},${posY} ${posX - height * TAPER},${posY}" fill="${HEX.leafMid}"/>`;

// every node stands on a small floating island of forest, the same tile language as the field check
function island([posX, posY]: Point): string {
  const top = posY + ISLAND.drop;
  const { reach, half, full, thick, bottom } = ISLAND;
  const [left, right] = [posX - reach, posX + reach];
  const [leftTree, rightTree] = ISLAND_TREES;

  return (
    `<g class="island">` +
    fan(
      [
        [posX, top],
        [right, top + half],
        [posX, top + full],
        [left, top + half],
      ],
      [posX, top + half],
      ramp(HEX.grassDark, HEX.grassLight),
    ) +
    `<polygon points="${left},${top + half} ${posX},${top + full} ${posX},${top + bottom} ${left},${top + half + thick}" fill="${HEX.soilLight}"/>` +
    `<polygon points="${posX},${top + full} ${right},${top + half} ${right},${top + half + thick} ${posX},${top + bottom}" fill="${HEX.soil}"/>` +
    tree(posX + leftTree.dx, top + leftTree.dy, leftTree.height) +
    tree(posX + rightTree.dx, top + rightTree.dy, rightTree.height) +
    `</g>`
  );
}

export function pipelineSVG(): string {
  const rng = mulberry32(SEED);
  const path = smoothPath([point('30,240'), ...NODES.map((node) => node.at), point('1570,170')]);
  const track = `<path d="${path}" fill="none" stroke="#D3D0C6" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 16"/>`;
  const flow = `<path class="flow" d="${path}" fill="none" stroke="${HEX.verified}" stroke-width="6" stroke-linecap="round"/>`;
  const nodes = NODES.map(({ icon, at: [posX, posY] }) => {
    const shape = { x: posX, y: posY, r: NODE.reach };
    const off = blob(rng, shape, {
      sides: 8,
      squash: 1,
      palette: ramp('#DAD7CD', '#FFFFFF'),
      gradient: false,
    });
    const glow = blob(rng, shape, {
      sides: 8,
      squash: 1,
      palette: ramp(HEX.primarySoft, '#FFFFFF'),
      gradient: false,
    });
    const box = { x: posX - NODE.half, y: posY - NODE.half, width: NODE.size, height: NODE.size };

    return `<g class="node" data-x="${posX}" data-y="${posY}">${off}<g class="node-on" opacity="0">${glow}<circle cx="${posX}" cy="${posY}" r="${NODE.ring}" fill="none" stroke="${HEX.verified}" stroke-width="4"/></g>${nest(iconSVG(icon), box)}</g>`;
  }).join('');
  const islands = NODES.map((node) => island(node.at)).join('');
  // the payout: three coins burst out of the chain node when the proof arrives
  const [chainX, chainY] = NODES[NODES.length - 1].at;
  const payout = PAYOUT.map(([offsetX, offsetY]) =>
    nest(
      coinSVG(),
      {
        x: chainX + offsetX - PAYOUT_COIN.half,
        y: chainY + offsetY - PAYOUT_COIN.half,
        width: PAYOUT_COIN.size,
        height: PAYOUT_COIN.size,
      },
      'payout',
    ),
  ).join('');
  const gem = fan(
    Array.from({ length: GEM.sides }, (_item, index): Point => [
      Math.cos((index / GEM.sides) * Math.PI * 2) * GEM.reach,
      Math.sin((index / GEM.sides) * Math.PI * 2) * GEM.reach,
    ]),
    [0, GEM.lift],
    ramp(HEX.leafDark, HEX.sprout),
  );

  // token starts on the path's first point; MotionPath takes over once the timeline runs
  return svg(
    '0 0 1600 360',
    `${track}${islands}${flow}${nodes}${payout}<g class="token" transform="translate(30 240)">${gem}</g>`,
    'tc-pipeline',
  );
}

const SAMPLES = 400;
const LAST_NODE_AT = 0.94;
const MIDDLE = 0.5;
const PAYOUT_AT = 0.93;

/** Path draws, the proof token rides it, and each node lights up the moment the token reaches it. */
export function pipelineTimeline(root: Element): Timeline {
  const flow = pick<SVGPathElement>(root, '.flow');
  const total = flow.getTotalLength();
  const fractionAt = (posX: number, posY: number): number => {
    let best = 0;
    let bestDistance = Infinity;
    for (let step = 0; step <= SAMPLES; step += 1) {
      const sample = flow.getPointAtLength((step / SAMPLES) * total);
      const distance = (sample.x - posX) ** 2 + (sample.y - posY) ** 2;
      if (distance < bestDistance) {
        [best, bestDistance] = [step / SAMPLES, distance];
      }
    }

    return best;
  };

  const timeline = paused({ defaults: { ease: EASE.none } });
  timeline.fromTo(flow, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0).to(
    pick(root, '.token'),
    {
      duration: 1,
      motionPath: { path: flow, align: flow, alignOrigin: [MIDDLE, MIDDLE], autoRotate: true },
    },
    0,
  );
  root.querySelectorAll<SVGElement>('.node').forEach((node) => {
    const { x: posX, y: posY } = node.dataset;
    const start = Math.min(fractionAt(Number(posX), Number(posY)), LAST_NODE_AT);
    timeline.to(pick(node, '.node-on'), { opacity: 1, duration: 0.04 }, start).fromTo(
      node,
      { scale: 1, svgOrigin: `${posX} ${posY}` },
      {
        scale: 1.12,
        svgOrigin: `${posX} ${posY}`,
        duration: 0.03,
        yoyo: true,
        repeat: 1,
        ease: EASE.soft,
      },
      start,
    );
  });
  timeline.fromTo(
    root.querySelectorAll('[data-nest=payout]'),
    { scale: 0, opacity: 0, y: 30, transformOrigin: '50% 50%' },
    { scale: 1, opacity: 1, y: 0, stagger: 0.02, duration: 0.05, ease: 'back.out(2.5)' },
    PAYOUT_AT,
  );

  return timeline;
}
