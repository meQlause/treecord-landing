// "Planted. Photographed. Forgotten." A polaroid of a fresh seedling: the flash fires, then the seedling wilts,
// the photo yellows and the card is tossed aside.
import { pick } from '../dom';
import { HEX } from '../palette';
import { mulberry32 } from '../random';
import { blob, fan, leaf, limb, mix, point, ramp, svg } from './lowpoly';
import { EASE, paused, settle, type Timeline } from './timeline';

const SEED = 61;
const TILT = 0.45;
const SPROUT_MIX = 0.55;
const LEAF = { length: 46, width: 17 };
const FRAME = 'x="30" y="30" width="200" height="190"';
const PIVOT = { card: '130 160', leaf: '130 152', stem: '130 194' };

export function forgottenSVG(): string {
  const rng = mulberry32(SEED);
  const shade = mix(HEX.sprout, HEX.leafMid, SPROUT_MIX);
  const card = fan('14,16 246,12 248,298 12,296', point('130,155'), ramp('#E9E6DD', '#FFFFFF'));
  const shadow = `<polygon points="22,26 256,24 258,308 20,306" fill="${HEX.text}" fill-opacity="0.08"/>`;
  const grass = blob(
    rng,
    { x: 130, y: 262, r: 170 },
    { sides: 9, squash: 0.42, palette: ramp(HEX.grassDark, HEX.grassLight) },
  );
  const mound = blob(
    rng,
    { x: 130, y: 194, r: 50 },
    { sides: 8, squash: 0.26, palette: ramp(HEX.soil, HEX.soilLight), gradient: false },
  );
  const stem = limb({
    from: point('130,194'),
    to: point('130,150'),
    width: { start: 7, end: 4 },
    rng,
    segments: 2,
  });
  const leftLeaf = leaf(point('130,152'), { ...LEAF, angle: Math.PI + TILT }, shade, HEX.sprout);
  const rightLeaf = leaf(point('130,152'), { ...LEAF, angle: -TILT }, HEX.sprout, shade);
  const photo =
    `<rect ${FRAME} fill="${HEX.primarySoft}"/>` +
    grass +
    `<g class="mound">${mound}</g>` +
    `<g class="stem">${stem}</g>` +
    `<g class="leafL" data-pivot="130 152">${leftLeaf}</g>` +
    `<g class="leafR" data-pivot="130 152">${rightLeaf}</g>` +
    `<rect class="sepia" ${FRAME} fill="#C9A66B" opacity="0" style="mix-blend-mode:multiply"/>` +
    `<rect class="flash" ${FRAME} fill="#FFFFFF" opacity="0"/>`;
  const caption =
    `<text x="40" y="262" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="700" fill="${HEX.muted}">DAY 1</text>` +
    `<path d="M196,250 L204,260 L222,240" fill="none" stroke="${HEX.verified}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;

  return svg(
    '0 0 270 320',
    `<defs><clipPath id="tc-polaroid"><rect ${FRAME}/></clipPath></defs>` +
      `<g class="card">${shadow}${card}<g clip-path="url(#tc-polaroid)">${photo}</g>${caption}</g>`,
    'tc-forgotten',
  );
}

const WHEN = {
  flashOn: 0.22,
  flashOff: 0.25,
  leftLeaf: 0.42,
  rightLeaf: 0.45,
  stem: 0.45,
  dry: 0.45,
  sepia: 0.5,
  toss: 0.8,
};
const DRY = 0.8;

/** Fills fade toward dry grass: a function value, so each polygon starts from its own colour. */
const dry = (amount: number) => (_index: number, element: Element) =>
  mix(element.getAttribute('fill') ?? HEX.dry, HEX.dry, amount);

export function forgottenTimeline(root: Element): Timeline {
  const flash = pick(root, '.flash');
  const timeline = paused();
  timeline
    .fromTo(
      pick(root, '.card'),
      { y: -40, rotation: -8, opacity: 0, svgOrigin: PIVOT.card },
      {
        y: 0,
        rotation: -2,
        opacity: 1,
        svgOrigin: PIVOT.card,
        duration: 0.2,
        ease: EASE.strongOut,
      },
      0,
    )
    .to(flash, { opacity: 1, duration: 0.03 }, WHEN.flashOn)
    .to(flash, { opacity: 0, duration: 0.12 }, WHEN.flashOff)
    .to(
      pick(root, '.leafL'),
      { rotation: -55, svgOrigin: PIVOT.leaf, duration: 0.35, ease: EASE.in },
      WHEN.leftLeaf,
    )
    .to(
      pick(root, '.leafR'),
      { rotation: 55, svgOrigin: PIVOT.leaf, duration: 0.35, ease: EASE.in },
      WHEN.rightLeaf,
    )
    .to(
      pick(root, '.stem'),
      { rotation: 12, svgOrigin: PIVOT.stem, duration: 0.35, ease: EASE.in },
      WHEN.stem,
    )
    .to(
      root.querySelectorAll('.leafL polygon, .leafR polygon, .stem polygon'),
      { fill: dry(DRY), stroke: dry(DRY), duration: 0.35 },
      WHEN.dry,
    )
    .to(pick(root, '.sepia'), { opacity: 0.45, duration: 0.35 }, WHEN.sepia)
    .to(
      pick(root, '.card'),
      { rotation: 9, y: 16, opacity: 0.7, svgOrigin: PIVOT.card, duration: 0.2, ease: EASE.in },
      WHEN.toss,
    );

  return settle(timeline);
}
