// Code-generated diagrams: proof pipeline (B4) and the 36-month milestone track (B5).
import { mulberry32, HEX, svg, blob, fan, ramp } from './lowpoly.js';
import { iconSVG } from './icons.js';
import { coinSVG, nest } from './objects.js';

const MONO = `font-family="JetBrains Mono, ui-monospace, monospace"`;

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(points) {
  let d = `M${points[0].join(',')}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const [p1, p2] = [points[i], points[i + 1]];
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1.map(Math.round).join(',')} ${c2.map(Math.round).join(',')} ${p2.join(',')}`;
  }
  return d;
}

// ---------------------------------------------------------------- pipeline
export const PIPELINE_NODES = [
  { icon: 'video', at: [200, 190] },
  { icon: 'ai', at: [600, 130] },
  { icon: 'donor', at: [1000, 210] },
  { icon: 'chain', at: [1400, 140] },
];

export function pipelineSVG() {
  const rng = mulberry32(81);
  const d = smoothPath([[30, 240], ...PIPELINE_NODES.map((n) => n.at), [1570, 170]]);
  const track = `<path d="${d}" fill="none" stroke="#D3D0C6" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 16"/>`;
  const flow = `<path class="flow" d="${d}" fill="none" stroke="${HEX.verified}" stroke-width="6" stroke-linecap="round"/>`;
  const nodes = PIPELINE_NODES.map(({ icon, at: [x, y] }) => {
    const off = blob(rng, x, y, 62, {
      n: 8,
      squash: 1,
      palette: ramp('#DAD7CD', '#FFFFFF'),
      gradient: false,
    });
    const on = blob(rng, x, y, 62, {
      n: 8,
      squash: 1,
      palette: ramp(HEX.primarySoft, '#FFFFFF'),
      gradient: false,
    });
    return `<g class="node" data-x="${x}" data-y="${y}">${off}<g class="node-on" opacity="0">${on}<circle cx="${x}" cy="${y}" r="66" fill="none" stroke="${HEX.verified}" stroke-width="4"/></g>${nest(iconSVG(icon), x - 34, y - 34, 68, 68)}</g>`;
  }).join('');
  // every node stands on a small floating island of forest, the same tile language as the field check
  const tree = (x, y, h) =>
    `<polygon points="${x},${y - h} ${x + h * 0.36},${y} ${x},${y}" fill="${HEX.leafLight}"/><polygon points="${x},${y - h} ${x},${y} ${x - h * 0.36},${y}" fill="${HEX.leafMid}"/>`;
  const islands = PIPELINE_NODES.map(({ at: [x, y] }) => {
    const t = y + 70;
    return (
      `<g class="island">` +
      fan(
        [
          [x, t],
          [x + 64, t + 20],
          [x, t + 40],
          [x - 64, t + 20],
        ],
        [x, t + 20],
        ramp(HEX.grassDark, HEX.grassLight),
      ) +
      `<polygon points="${x - 64},${t + 20} ${x},${t + 40} ${x},${t + 52} ${x - 64},${t + 32}" fill="${HEX.soilLight}"/>` +
      `<polygon points="${x},${t + 40} ${x + 64},${t + 20} ${x + 64},${t + 32} ${x},${t + 52}" fill="${HEX.soil}"/>` +
      tree(x - 40, t + 24, 22) +
      tree(x + 42, t + 22, 18) +
      `</g>`
    );
  }).join('');
  // the payout: three coins burst out of the chain node when the proof arrives
  const [cx, cy] = PIPELINE_NODES[3].at;
  const payout = [
    [cx + 60, cy - 70],
    [cx + 100, cy - 30],
    [cx + 120, cy - 84],
  ]
    .map(([x, y]) => nest(coinSVG(), x - 18, y - 18, 36, 36, 'payout'))
    .join('');
  const r = 18;
  const gem = fan(
    Array.from({ length: 6 }, (_, i) => [
      Math.cos((i / 6) * Math.PI * 2) * r,
      Math.sin((i / 6) * Math.PI * 2) * r,
    ]),
    [0, -3],
    ramp(HEX.leafDark, HEX.sprout),
  );
  // token starts on the path's first point; MotionPath takes over once the timeline runs
  return svg(
    '0 0 1600 360',
    `${track}${islands}${flow}${nodes}${payout}<g class="token" transform="translate(30 240)">${gem}</g>`,
    'tc-pipeline',
  );
}

/** Path draws, the proof token rides it, and each node lights up the moment the token reaches it. */
export function pipelineTimeline(root, gsap) {
  const flow = root.querySelector('.flow');
  const total = flow.getTotalLength();
  const fractionAt = (x, y) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i <= 400; i++) {
      const p = flow.getPointAtLength((i / 400) * total);
      const dist = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (dist < bestD) [best, bestD] = [i / 400, dist];
    }
    return best;
  };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.fromTo(flow, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0).to(
    root.querySelector('.token'),
    {
      duration: 1,
      motionPath: { path: flow, align: flow, alignOrigin: [0.5, 0.5], autoRotate: true },
    },
    0,
  );
  root.querySelectorAll('.node').forEach((node) => {
    const { x, y } = node.dataset;
    const at = Math.min(fractionAt(+x, +y), 0.94);
    tl.to(node.querySelector('.node-on'), { opacity: 1, duration: 0.04 }, at).fromTo(
      node,
      { scale: 1, svgOrigin: `${x} ${y}` },
      {
        scale: 1.12,
        svgOrigin: `${x} ${y}`,
        duration: 0.03,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      },
      at,
    );
  });
  tl.fromTo(
    root.querySelectorAll('[data-nest=payout]'),
    { scale: 0, opacity: 0, y: 30, transformOrigin: '50% 50%' },
    { scale: 1, opacity: 1, y: 0, stagger: 0.02, duration: 0.05, ease: 'back.out(2.5)' },
    0.93,
  );
  return tl;
}

// ---------------------------------------------------------------- milestones
/** PRODUCT_KNOWLEDGE.md §3: due months and share of the per-tree incentive. */
export const MILESTONES = [
  { month: 0, share: 10 },
  { month: 3, share: 10 },
  { month: 6, share: 10 },
  { month: 12, share: 15 },
  { month: 24, share: 15 },
  { month: 36, share: 40 },
];
const X0 = 100;
const X1 = 1100;
const Y = 180;
const xAt = (month) => X0 + (month / 36) * (X1 - X0); // true time scale, so 24 -> 36 looks as long as it is

export function milestonesSVG() {
  const rng = mulberry32(91);
  const base = `<path d="M${X0},${Y} L${X1},${Y}" stroke="#D3D0C6" stroke-width="6" stroke-linecap="round"/>`;
  const progress = `<path class="progress" d="M${X0},${Y} L${X1},${Y}" stroke="${HEX.verified}" stroke-width="6" stroke-linecap="round"/>`;
  const marks = MILESTONES.map(({ month, share }) => {
    const x = xAt(month);
    const size = 46 * Math.sqrt(share / 10); // coin area tracks the payout share
    return (
      `<g class="milestone" data-at="${month / 36}" data-x="${x}">` +
      blob(rng, x, Y, 15, {
        n: 7,
        squash: 1,
        palette: ramp('#C9C6BC', '#F2F0EA'),
        gradient: false,
      }) +
      `<g class="dot-on" opacity="0">${blob(rng, x, Y, 15, { n: 7, squash: 1, palette: ramp(HEX.leafDark, HEX.leafLight), gradient: false })}</g>` +
      nest(coinSVG(), x - size / 2, Y - 34 - size, size, size, 'coin') +
      `<text x="${x}" y="${Y + 44}" text-anchor="middle" ${MONO} font-size="15" fill="${HEX.muted}">${month}${month === 36 ? ' mo' : ''}</text>` +
      `</g>`
    );
  }).join('');
  return svg('0 0 1200 260', `${base}${progress}${marks}`, 'tc-milestones');
}

/** Progress 0..1 = month 0..36. Each milestone lights and pays its coin when the line reaches it. */
export function milestonesTimeline(root, gsap) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.fromTo(
    root.querySelector('.progress'),
    { drawSVG: '0%' },
    { drawSVG: '100%', duration: 1 },
    0,
  );
  root.querySelectorAll('.milestone').forEach((m) => {
    const at = Math.min(+m.dataset.at, 0.93);
    const coin = m.querySelector('[data-nest=coin]');
    tl.to(m.querySelector('.dot-on'), { opacity: 1, duration: 0.03 }, at).fromTo(
      coin,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.07, ease: 'back.out(2)' },
      at,
    );
  });
  return tl;
}
