// Hand-drawn marks: measure every .fx word, draw its mark in an overlay layer, and return a paused timeline
// that plays the marks one after another.
import { gsap } from 'gsap';
import { EASE, type Timeline } from '../../../shared/art/timeline';
import { HEX } from '../../../shared/palette';

// Paths are drawn in a normalised box (100 x 20, circle 100 x 40) and scaled to the word's real size,
// so stroke width stays even and DrawSVG lengths stay exact.
const SCRIBBLE = {
  under: ['M2,13 C18,8 30,18 48,12 S78,9 98,13'],
  alarm: ['M2,12 C8,17 14,7 22,12 S34,17 42,12 S54,7 62,12 S74,17 82,12 S94,8 98,11'],
  strike: ['M1,11 C30,8 65,14 99,9', 'M4,14 C35,11 70,16 97,11'],
  circle: ['M52,5 C80,3 98,11 97,20 C96,32 70,37 46,36 C20,35 3,29 4,18 C5,8 28,3 62,6'],
};
const NORM = { width: 100, line: 20, circle: 40 };

// green = what Treecord does right, red = the problem
const INK: Record<string, string> = {
  under: HEX.verified,
  circle: HEX.verified,
  new: HEX.verified,
  alarm: HEX.flagged,
  strike: HEX.flagged,
  ring: HEX.flagged,
};

const DIGITS = 1;
const MIN_WIDTH = 4;
const STROKE = { min: 2.5, share: 0.07 };
const STEP = { strike: 0.16, other: 0.11 };
const MARK = { pad: 14, shift: 7, heightShare: 0.72, top: 0.18, fillOpacity: '0.5' };
const MARK_POLYGON = { left: 0.25, right: 0.05, farBottom: 0.85, farLeft: 0.97, nearLeft: 0.02 };
const LOOP = { widen: 1.28, heighten: 1.25, left: 0.14, top: 0.12 };
const STRIKE = { pad: 8, shift: 4, heightShare: 0.3, top: 0.4 };
const LINE = { pad: 8, shift: 4, heightShare: 0.3, top: 0.78 };
const AFTER = { loopColor: 0.04, strikeSecond: 0.08, strikeFade: 0.06, newLine: 0.08 };

type Box = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

interface Spot {
  timeline: Timeline;
  layers: { back: Element; front: Element };
  word: HTMLElement;
  kind: string;
  rect: Box;
  pos: { x: number; y: number };
  start: number;
  /** One stroked path in the word's ink colour. */
  ink: (path: string) => string;
}

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Scales every "x,y" pair of a path whose tokens are an optional command letter plus one pair, like "C18,8". */
const scale = (path: string, ratioX: number, ratioY: number): string =>
  path
    .split(' ')
    .map((token) => {
      const letter =
        token.startsWith('M') || token.startsWith('C') || token.startsWith('S') ? token[0] : '';
      const [posX, posY] = token.slice(letter.length).split(',').map(Number);

      return `${letter}${(posX * ratioX).toFixed(DIGITS)},${(posY * ratioY).toFixed(DIGITS)}`;
    })
    .join(' ');

function svgAt(parent: Element, frame: Frame, body: string): Element {
  const { x: posX, y: posY, width, height } = frame;
  const view = `0 0 ${width.toFixed(DIGITS)} ${height.toFixed(DIGITS)}`;
  parent.insertAdjacentHTML(
    'beforeend',
    `<svg viewBox="${view}" style="left:${posX}px;top:${posY}px;width:${width}px;height:${height}px" aria-hidden="true">${body}</svg>`,
  );

  return parent.lastElementChild as Element;
}

function markSpot({ timeline, layers, rect, pos, start }: Spot): void {
  const [width, height] = [rect.width + MARK.pad, rect.height * MARK.heightShare];
  const { left, right, farBottom, farLeft, nearLeft } = MARK_POLYGON;
  const polygon = `<polygon points="0,${height * left} ${width},${height * right} ${width * farLeft},${height * farBottom} ${width * nearLeft},${height}" fill="${HEX.pending}" fill-opacity="${MARK.fillOpacity}"/>`;
  const frame = { x: pos.x - MARK.shift, y: pos.y + rect.height * MARK.top, width, height };
  timeline.fromTo(
    svgAt(layers.back, frame, polygon),
    { scaleX: 0 },
    { scaleX: 1, transformOrigin: '0% 50%', duration: 0.12, ease: EASE.out },
    start,
  );
}

function loopSpot({ timeline, layers, word, kind, rect, pos, start, ink }: Spot): void {
  const [width, height] = [rect.width * LOOP.widen, rect.height * LOOP.heighten];
  const frame = {
    x: pos.x - rect.width * LOOP.left,
    y: pos.y - rect.height * LOOP.top,
    width,
    height,
  };
  const body = ink(scale(SCRIBBLE.circle[0], width / NORM.width, height / NORM.circle));
  const stroke = svgAt(layers.front, frame, body).querySelector('path');
  timeline.fromTo(
    stroke,
    { drawSVG: '0%', opacity: 0 },
    { drawSVG: '100%', opacity: 1, duration: 0.16, ease: 'power1.inOut' },
    start,
  );
  timeline.to(word, { color: INK[kind], duration: 0.08 }, start + AFTER.loopColor);
}

function strikeSpot({ timeline, layers, word, rect, pos, start, ink }: Spot): void {
  const [width, height] = [rect.width + STRIKE.pad, rect.height * STRIKE.heightShare];
  const frame = { x: pos.x - STRIKE.shift, y: pos.y + rect.height * STRIKE.top, width, height };
  const body = SCRIBBLE.strike
    .map((path) => ink(scale(path, width / NORM.width, height / NORM.line)))
    .join('');
  const [first, second] = svgAt(layers.front, frame, body).querySelectorAll('path');
  timeline
    .fromTo(
      first,
      { drawSVG: '0%', opacity: 0 },
      { drawSVG: '100%', opacity: 1, duration: 0.08, ease: EASE.none },
      start,
    )
    .fromTo(
      second,
      { drawSVG: '100% 100%', opacity: 0 },
      { drawSVG: '0% 100%', opacity: 1, duration: 0.07, ease: EASE.none },
      start + AFTER.strikeSecond,
    )
    .to(word, { color: HEX.muted, opacity: 0.55, duration: 0.08 }, start + AFTER.strikeFade);
}

/** under, alarm, and the underline of a swapped-in word */
function lineSpot({ timeline, layers, word, kind, rect, pos, start, ink }: Spot): void {
  const [width, height] = [rect.width + LINE.pad, rect.height * LINE.heightShare];
  const frame = { x: pos.x - LINE.shift, y: pos.y + rect.height * LINE.top, width, height };
  const scribble = SCRIBBLE[kind === 'alarm' ? 'alarm' : 'under'][0];
  const stroke = svgAt(
    layers.front,
    frame,
    ink(scale(scribble, width / NORM.width, height / NORM.line)),
  ).querySelector('path');
  const isNew = kind === 'new';
  if (isNew) {
    timeline.from(
      word.querySelectorAll('.w'),
      { yPercent: 120, opacity: 0, rotate: 4, stagger: 0.02, duration: 0.12, ease: 'power4.out' },
      start,
    );
  }
  timeline.fromTo(
    stroke,
    { drawSVG: '0%', opacity: 0 },
    { drawSVG: '100%', opacity: 1, duration: 0.12, ease: 'power1.out' },
    start + (isNew ? AFTER.newLine : 0),
  );
  if (kind === 'alarm') {
    timeline.to(word, { color: HEX.flagged, duration: 0.08 }, start);
  }
  if (isNew) {
    timeline.to(word, { color: HEX.verified, duration: 0.01 }, start);
  }
}

const DRAWERS: Record<string, (spot: Spot) => void> = {
  mark: markSpot,
  circle: loopSpot,
  ring: loopSpot,
  strike: strikeSpot,
};

type Parts = Pick<Spot, 'timeline' | 'layers' | 'word' | 'kind' | 'rect' | 'start'>;

function drawSpot(parts: Parts, base: Box): void {
  const { rect, kind } = parts;
  const color = INK[kind];
  const width = Math.max(STROKE.min, rect.height * STROKE.share);
  const ink = (path: string): string =>
    `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width.toFixed(DIGITS)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const pos = { x: rect.left - base.left, y: rect.top - base.top };
  (DRAWERS[kind] ?? lineSpot)({ ...parts, pos, ink });
}

const addLayer = (box: Element, cls: string): Element =>
  box.appendChild(Object.assign(document.createElement('div'), { className: cls }));

/**
 * Measure every .fx word inside `box`, draw its mark in an overlay layer, and return a paused timeline
 * that plays the marks one after another. Call after the fonts load, after SplitText has split `box`,
 * and before any ancestor is scaled (positions are read from layout).
 * ponytail: positions are measured once; the page reloads on a real width change. Upgrade path: re-measure
 * in SplitText's onSplit with autoSplit.
 */
export function drawFx(box: Element): Timeline {
  const timeline = gsap.timeline({ paused: true });
  const base = box.getBoundingClientRect();
  const layers = {
    back: addLayer(box, 'fx-layer fx-layer--back'),
    front: addLayer(box, 'fx-layer'),
  };
  let start = 0;
  box.querySelectorAll<HTMLElement>('.fx').forEach((word) => {
    const kind = word.dataset.fx ?? '';
    for (const rect of [...word.getClientRects()].filter((spot) => spot.width > MIN_WIDTH)) {
      drawSpot({ timeline, layers, word, kind, rect, start }, base);
    }
    start += kind === 'strike' ? STEP.strike : STEP.other;
  });

  return timeline;
}
