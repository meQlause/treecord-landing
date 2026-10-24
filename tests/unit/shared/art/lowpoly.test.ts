import { describe, expect, it } from 'vitest';
import {
  blob,
  crown,
  fan,
  leaf,
  limb,
  lit,
  mix,
  nest,
  parse,
  point,
  poly,
  pts,
  ramp,
  rows,
  shadeFaces,
  svg,
  type Point,
} from '../../../../src/shared/art/lowpoly';
import { HEX } from '../../../../src/shared/palette';
import { mulberry32 } from '../../../../src/shared/random';

const polygons = (markup: string): number => markup.split('<polygon').length - 1;

const TRIANGLE: Point[] = [
  [8.04, 18],
  [44, 18.26],
  [8, 46],
];
const SQUARE: Point[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

describe('geometry written as text', () => {
  it('reads points, rows of numbers and a single point', () => {
    expect(parse('22,70 74.5,70  80,78')).toEqual([
      [22, 70],
      [74.5, 70],
      [80, 78],
    ]);
    expect(rows('262,118,46 312,96,58')).toEqual([
      [262, 118, 46],
      [312, 96, 58],
    ]);
    expect(point('48,136')).toEqual([48, 136]);
  });

  it('writes points rounded to a tenth', () => {
    expect(pts(TRIANGLE)).toBe('8,18 44,18.3 8,46');
  });
});

describe('markup wrappers', () => {
  it('poly is a filled polygon with a same-colour hairline, from points or from text', () => {
    const markup = poly(TRIANGLE, '#2E7D4A');

    expect(markup).toContain('<polygon points="8,18 44,18.3 8,46"');
    expect(markup).toContain('fill="#2E7D4A" stroke="#2E7D4A"');
    expect(poly('8.04,18 44,18.26 8,46', '#2E7D4A')).toBe(markup);
  });

  it('poly passes extra attributes through', () => {
    expect(poly(TRIANGLE, '#fff', 'class="facet"')).toContain(' class="facet"/>');
  });

  it('svg wraps a body, marks itself decorative, and takes an optional class', () => {
    const markup = svg('0 0 64 64', '<g/>', 'tc-icon');

    expect(markup).toContain('viewBox="0 0 64 64"');
    expect(markup).toContain('class="tc-icon"');
    expect(markup).toContain('aria-hidden="true" focusable="false"');
    expect(markup).toContain('<g/></svg>');
    expect(svg('0 0 1 1', '')).not.toContain('class=');
  });

  it('nest places one svg inside another, in a group GSAP can move', () => {
    const box = { x: 43, y: 93, width: 34, height: 34 };
    const markup = nest(svg('0 0 100 100', ''), box, 'coin');

    expect(
      markup.startsWith('<g data-nest="coin"><svg x="43" y="93" width="34" height="34" '),
    ).toBe(true);
    expect(nest(svg('0 0 1 1', ''), box).startsWith('<g><svg')).toBe(true);
  });
});

describe('colour', () => {
  it('mix returns its ends at 0 and 1 and the middle halfway, clamping outside', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#000000', '#ffffff', -3)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 9)).toBe('#ffffff');
  });

  it('ramp runs from its dark end to its light end, getting lighter all the way', () => {
    const steady = ramp('#000000', '#ffffff');
    const reds = [0, 0.25, 0.5, 0.75, 1].map((ratio) => parseInt(steady(ratio).slice(1, 3), 16));

    expect(steady(0)).toBe('#000000');
    expect(steady(1)).toBe('#ffffff');
    expect(reds).toEqual([...reds].sort((first, second) => first - second));
  });

  it('crown starts at the dark leaf colour and ends lighter than it', () => {
    const red = (hex: string) => parseInt(hex.slice(1, 3), 16);

    expect(crown(0)).toBe(HEX.leafDark.toLowerCase());
    expect(red(crown(1))).toBeGreaterThan(red(crown(0)));
  });

  it('lit stays in 0..1 and is brighter on the sunward side', () => {
    const grid = [-50, -5, 0, 5, 50];
    const all = grid.flatMap((deltaX) => grid.map((deltaY) => lit(deltaX, deltaY)));

    expect(all.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(lit(0.55, -0.83)).toBeGreaterThan(lit(-0.55, 0.83));
  });
});

describe('facets', () => {
  const palette = ramp(HEX.leafDark, HEX.leafLight);

  it('fan draws one triangle per outline point, from text or from points', () => {
    expect(polygons(fan(SQUARE, [5, 5], palette))).toBe(SQUARE.length);
    expect(fan('0,0 10,0 10,10 0,10', [5, 5], palette)).toBe(fan(SQUARE, [5, 5], palette));
  });

  it('shadeFaces draws each face once and passes attributes through', () => {
    const markup = shadeFaces([TRIANGLE, SQUARE.slice(0, 3)], [20, 20], palette, {
      attrs: 'class="facet"',
    });

    expect(polygons(markup)).toBe(2);
    expect(markup.split('class="facet"')).toHaveLength(3);
  });

  it('shading is deterministic for a salt and varies with it', () => {
    const first = shadeFaces([TRIANGLE], [20, 20], palette, { salt: 1 });

    expect(shadeFaces([TRIANGLE], [20, 20], palette, { salt: 1 })).toBe(first);
    expect(shadeFaces([TRIANGLE], [20, 20], palette, { salt: 2 })).not.toBe(first);
  });
});

describe('blob, leaf and limb', () => {
  const shape = { x: 130, y: 262, r: 170 };

  it('blob is three facets per side (centre fan, inner ring, outer ring)', () => {
    expect(polygons(blob(mulberry32(1), shape))).toBe(21); // seven sides by default
    expect(polygons(blob(mulberry32(1), shape, { sides: 5 }))).toBe(15);
    expect(polygons(blob(mulberry32(1), shape, { sides: 9, gradient: false }))).toBe(27);
  });

  it('blob is the same for the same seed and different for another', () => {
    const first = blob(mulberry32(7), shape);

    expect(blob(mulberry32(7), shape)).toBe(first);
    expect(blob(mulberry32(8), shape)).not.toBe(first);
  });

  it('blob stays inside its radius on the x axis, give or take its wobble', () => {
    const markup = blob(mulberry32(3), { x: 0, y: 0, r: 100 });
    const columns = [...markup.matchAll(/points="([^"]+)"/g)].flatMap(([, list]) =>
      parse(list).map(([posX]) => posX),
    );

    expect(Math.max(...columns)).toBeLessThanOrEqual(115);
    expect(Math.min(...columns)).toBeGreaterThanOrEqual(-115);
  });

  it('leaf is two facets, lit side and shadow side, along its angle', () => {
    const markup = leaf([0, 0], { length: 10, width: 4, angle: 0 }, '#aaaaaa', '#555555');

    expect(polygons(markup)).toBe(2);
    expect(markup).toContain('fill="#aaaaaa"');
    expect(markup).toContain('fill="#555555"');
    expect(markup).toContain('10,0'); // the tip, straight along angle 0
  });

  it('limb is two facets per segment, three segments by default', () => {
    const base = { from: [0, 0] as Point, to: [0, -60] as Point, width: { start: 10, end: 4 } };

    expect(polygons(limb({ ...base, rng: mulberry32(1) }))).toBe(6);
    expect(polygons(limb({ ...base, rng: mulberry32(1), segments: 2 }))).toBe(4);
    expect(polygons(limb({ ...base, rng: mulberry32(1), segments: 5 }))).toBe(10);
  });

  it('limb is deterministic for a seed', () => {
    const base = { from: [0, 0] as Point, to: [0, -60] as Point, width: { start: 10, end: 4 } };

    expect(limb({ ...base, rng: mulberry32(4) })).toBe(limb({ ...base, rng: mulberry32(4) }));
    expect(limb({ ...base, rng: mulberry32(4) })).not.toBe(limb({ ...base, rng: mulberry32(5) }));
  });
});
