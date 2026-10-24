// Low-poly SVG primitives. Pure string builders (no DOM), so they run in Node too.
import { HEX } from '../palette';
import { hash3, range, type Rng } from '../random';

export type Point = [number, number];

const ROUND = 10;
const HALF = 0.5;
const FULL_TURN = Math.PI * 2;
const HEX_RADIX = 16;
const CHANNELS = { red: 1, green: 3, blue: 5 }; // start of each pair in "#rrggbb"
const PAIR = 2;

const round1 = (value: number): number => Math.round(value * ROUND) / ROUND;

/** "262,118,46 312,96,58" -> [[262, 118, 46], [312, 96, 58]]. Geometry is written as text: it reads like SVG itself. */
export const rows = (text: string): number[][] =>
  text
    .trim()
    .split(/\s+/)
    .map((row) => row.split(',').map(Number));

/** "22,70 74,70 80,78" -> [[22, 70], [74, 70], [80, 78]]. */
export const parse = (text: string): Point[] => rows(text).map(([posX, posY]) => [posX, posY]);

/** "48,136" -> [48, 136] */
export const point = (text: string): Point => parse(text)[0];

export const pts = (points: Point[]): string =>
  points.map(([posX, posY]) => `${round1(posX)},${round1(posY)}`).join(' ');

const asPoints = (shape: Point[] | string): Point[] =>
  typeof shape === 'string' ? parse(shape) : shape;

/** A filled triangle or polygon. The same-colour hairline stroke hides anti-aliasing seams between facets. */
export const poly = (shape: Point[] | string, fill: string, attrs = ''): string =>
  `<polygon points="${pts(asPoints(shape))}" fill="${fill}" stroke="${fill}" stroke-width="0.6" stroke-linejoin="round"${attrs ? ' ' + attrs : ''}/>`;

export const svg = (viewBox: string, body: string, cls = ''): string => {
  const classAttr = cls ? ` class="${cls}"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${classAttr} aria-hidden="true" focusable="false">${body}</svg>`;
};

export const MONO = 'font-family="JetBrains Mono, ui-monospace, monospace"';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Place one asset's <svg> inside another. Wrapped in a <g> because browsers ignore `transform` on nested
 * <svg> elements, so the <g> is what GSAP moves and scales.
 */
export const nest = (markup: string, box: Box, cls = ''): string => {
  const data = cls ? ` data-nest="${cls}"` : '';
  const placed = markup.replace(
    '<svg ',
    `<svg x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" `,
  );

  return `<g${data}>${placed}</g>`;
};

// ---------------------------------------------------------------- colour
const channels = (hex: string): number[] =>
  Object.values(CHANNELS).map((offset) => parseInt(hex.slice(offset, offset + PAIR), HEX_RADIX));

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

export function mix(from: string, to: string, ratio: number): string {
  const start = channels(from);
  const end = channels(to);
  const parts = start.map((value, index) =>
    Math.round(value + (end[index] - value) * clamp01(ratio))
      .toString(HEX_RADIX)
      .padStart(PAIR, '0'),
  );

  return `#${parts.join('')}`;
}

const CROWN = { ramp: 1.6, topStart: 0.55, topSpan: 0.45, topMix: 0.85 };

/** Same foliage ramp as the 3D crownColor(): dark underside, sunlit top. */
export function crown(ratio: number): string {
  const base = mix(HEX.leafDark, HEX.leafMid, Math.min(ratio * CROWN.ramp, 1));
  if (ratio <= CROWN.topStart) {
    return base;
  }

  return mix(base, HEX.leafLight, ((ratio - CROWN.topStart) / CROWN.topSpan) * CROWN.topMix);
}

/** Two-colour ramp, for soil, paper, coins, icons. */
export type Palette = (ratio: number) => string;
export const ramp =
  (dark: string, light: string): Palette =>
  (ratio) =>
    mix(dark, light, ratio);

// Sun from the upper right, the same side as the 3D DirectionalLight at (12, 20, 8). SVG y points down.
const SUN = { x: 0.55, y: -0.83 };
const LIT = { facing: 0.8, noise: 0.2 };

/** 0..1 brightness of a facet that faces away from its shape's centre along (dx, dy). */
export function lit(deltaX: number, deltaY: number, shade = HALF): number {
  const length = Math.hypot(deltaX, deltaY) || 1;
  const facing = (deltaX * SUN.x + deltaY * SUN.y) / length;

  return clamp01((HALF + HALF * facing) * LIT.facing + shade * LIT.noise);
}

const centroid = (face: Point[]): Point => [
  face.reduce((sum, corner) => sum + corner[0], 0) / face.length,
  face.reduce((sum, corner) => sum + corner[1], 0) / face.length,
];

export interface ShadeOptions {
  /** With `height`, adds a vertical gradient from `top` downward. */
  top?: number | null;
  height?: number;
  salt?: number;
  attrs?: string;
}

const GRADIENT = { lit: 0.7, vertical: 0.3 };

/** Shade a list of triangles around `centre` with `palette(t)`; `top`/`height` add a vertical gradient. */
export function shadeFaces(
  faces: Point[][],
  centre: Point,
  palette: Palette,
  options: ShadeOptions = {},
): string {
  const { top = null, height = 1, salt = 0, attrs = '' } = options;

  return faces
    .map((face) => {
      const [faceX, faceY] = centroid(face);
      let tone = lit(faceX - centre[0], faceY - centre[1], hash3(faceX, faceY, 0, salt));
      if (top !== null) {
        tone = tone * GRADIENT.lit + (1 - clamp01((faceY - top) / height)) * GRADIENT.vertical;
      }

      return poly(face, palette(tone), attrs);
    })
    .join('');
}

/** Fan a convex-ish outline from a centre point into triangles, shaded by facing. */
export function fan(
  outline: Point[] | string,
  centre: Point,
  palette: Palette,
  options?: ShadeOptions,
): string {
  const ring = asPoints(outline);
  const faces = ring.map((corner, index): Point[] => [
    centre,
    corner,
    ring[(index + 1) % ring.length],
  ]);

  return shadeFaces(faces, centre, palette, options);
}

export interface BlobShape {
  x: number;
  y: number;
  r: number;
}

export interface BlobOptions {
  sides?: number;
  squash?: number;
  palette?: Palette;
  gradient?: boolean;
}

const BLOB = {
  inner: 0.55,
  innerTurn: 0.5,
  wobble: 0.12,
  reachMin: 0.88,
  reachMax: 1.1,
  drift: 0.08,
  lift: 0.1,
};

/**
 * Low-poly blob, the 2D twin of a jittered icosahedron: centre fan + inner ring + outer ring = 3n facets.
 * Returns polygon markup.
 */
export function blob(rng: Rng, shape: BlobShape, options: BlobOptions = {}): string {
  const { sides = 7, squash = 0.86, palette = crown, gradient = true } = options;
  const { x: centreX, y: centreY, r: radius } = shape;
  const centre: Point = [centreX, centreY];
  const ring = (reach: number, turn: number): Point[] =>
    Array.from({ length: sides }, (_item, index) => {
      const angle = ((index + turn) / sides) * FULL_TURN + range(rng, -BLOB.wobble, BLOB.wobble);
      const spread = reach * range(rng, BLOB.reachMin, BLOB.reachMax);

      return [centreX + Math.cos(angle) * spread, centreY + Math.sin(angle) * spread * squash];
    });
  const outer = ring(radius, 0);
  const inner = ring(radius * BLOB.inner, BLOB.innerTurn);
  const middle: Point = [
    centreX + range(rng, -radius * BLOB.drift, radius * BLOB.drift),
    centreY - radius * BLOB.lift,
  ];
  const faces: Point[][] = [];
  for (let index = 0; index < sides; index += 1) {
    const next = (index + 1) % sides;
    faces.push(
      [outer[index], outer[next], inner[index]],
      [inner[index], outer[next], inner[next]],
      [middle, inner[index], inner[next]],
    );
  }
  const vertical = gradient
    ? { top: centreY - radius * squash, height: PAIR * radius * squash }
    : {};

  return shadeFaces(faces, centre, palette, vertical);
}

export interface LeafShape {
  length: number;
  width: number;
  /** Radians, 0 = right. */
  angle: number;
}

const RIB = 0.45;

/** A leaf: diamond split along its midrib, lit side lighter. Points from `base` along `shape.angle`. */
export function leaf(base: Point, shape: LeafShape, light: string, dark: string): string {
  const cos = Math.cos(shape.angle);
  const sin = Math.sin(shape.angle);
  const pointAt = (along: number, across: number): Point => [
    base[0] + along * cos - across * sin,
    base[1] + along * sin + across * cos,
  ];
  const root = pointAt(0, 0);
  const tip = pointAt(shape.length, 0);
  const left = pointAt(shape.length * RIB, -shape.width / PAIR);
  const right = pointAt(shape.length * RIB, shape.width / PAIR);

  return poly([root, left, tip], light) + poly([root, tip, right], dark);
}

export interface LimbOptions {
  from: Point;
  to: Point;
  width: { start: number; end: number };
  rng: Rng;
  dark?: string;
  light?: string;
  segments?: number;
}

const LIMB = { wobble: 0.15, shade: 0.25, litSide: 0.75, defaultSegments: 3 };

/** A tapered limb (trunk, branch) as two facets per segment: shadow side and lit side. */
export function limb(options: LimbOptions): string {
  const { from, to, width, rng, dark = HEX.bark, light = HEX.barkLight } = options;
  const { segments = LIMB.defaultSegments } = options;
  const [deltaX, deltaY] = [to[0] - from[0], to[1] - from[1]];
  const length = Math.hypot(deltaX, deltaY);
  const [normalX, normalY] = [-deltaY / length, deltaX / length];
  const edge = (along: number, side: number): Point => {
    const half = (width.start + (width.end - width.start) * along) / PAIR;
    const wobble = along > 0 && along < 1 ? range(rng, -half * LIMB.wobble, half * LIMB.wobble) : 0;

    return [
      from[0] + deltaX * along + normalX * (half * side + wobble),
      from[1] + deltaY * along + normalY * (half * side + wobble),
    ];
  };
  const out: string[] = [];
  for (let segment = 0; segment < segments; segment += 1) {
    const [near, far] = [segment / segments, (segment + 1) / segments];
    const spineNear: Point = [from[0] + deltaX * near, from[1] + deltaY * near];
    const spineFar: Point = [from[0] + deltaX * far, from[1] + deltaY * far];
    const tint = range(rng, 0, LIMB.shade);
    out.push(poly([edge(near, -1), spineNear, spineFar, edge(far, -1)], mix(dark, light, tint)));
    out.push(
      poly(
        [spineNear, edge(near, 1), edge(far, 1), spineFar],
        mix(dark, light, LIMB.litSide + tint),
      ),
    );
  }

  return out.join('');
}
