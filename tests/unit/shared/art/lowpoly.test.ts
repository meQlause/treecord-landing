import { describe, expect, it } from 'vitest';
import * as objects from '../../../../../svg-assets/src/objects.js';
import * as prototype from '../../../../../svg-assets/src/lowpoly.js';
import { HEX } from '../../../../src/shared/palette';
import { mulberry32 } from '../../../../src/shared/random';
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
  poly,
  pts,
  ramp,
  shadeFaces,
  svg,
  type Point,
} from '../../../../src/shared/art/lowpoly';

// The prototype's own module is the oracle: the same input must give the same markup, byte for byte.
const TRIANGLE: Point[] = [
  [8.04, 18],
  [44, 18.26],
  [8, 46],
];
const OUTLINE: Point[] = [
  [32, 14],
  [44, 32],
  [32, 50],
  [20, 32],
];
const RATIOS = [0, 0.1, 0.33, 0.55, 0.6, 0.9, 1, 1.4, -0.2];

describe('parse and pts', () => {
  it('reads geometry written as text', () => {
    expect(parse('22,70 74.5,70  80,78')).toEqual([
      [22, 70],
      [74.5, 70],
      [80, 78],
    ]);
  });

  it('rounds to a tenth like the prototype', () => {
    expect(pts(TRIANGLE)).toBe(prototype.pts(TRIANGLE));
    expect(pts(TRIANGLE)).toBe('8,18 44,18.3 8,46');
  });
});

describe('markup', () => {
  it('poly takes points or text and matches the prototype', () => {
    expect(poly(TRIANGLE, '#2E7D4A')).toBe(prototype.poly(TRIANGLE, '#2E7D4A'));
    expect(poly('8.04,18 44,18.26 8,46', '#2E7D4A', 'class="facet"')).toBe(
      prototype.poly(TRIANGLE, '#2E7D4A', 'class="facet"'),
    );
  });

  it('svg wraps a body and marks itself decorative', () => {
    expect(svg('0 0 64 64', '<g/>', 'tc-icon')).toBe(prototype.svg('0 0 64 64', '<g/>', 'tc-icon'));
    expect(svg('0 0 64 64', '<g/>')).toContain('aria-hidden="true"');
  });
});

describe('colour', () => {
  it.each(RATIOS)('mix, crown and ramp match the prototype at %f', (ratio) => {
    expect(mix('#1F5D3A', '#6BAE5E', ratio)).toBe(prototype.mix('#1F5D3A', '#6BAE5E', ratio));
    expect(crown(ratio)).toBe(prototype.crown(ratio));
    expect(ramp(HEX.soil, HEX.soilLight)(ratio)).toBe(
      prototype.ramp(HEX.soil, HEX.soilLight)(ratio),
    );
  });

  it.each([
    [0, -10, 0.5],
    [10, 0, 0.1],
    [-5, 5, 0.9],
    [0, 0, 0.5],
  ])('lit(%f, %f, %f) matches the prototype', (deltaX, deltaY, shade) => {
    expect(lit(deltaX, deltaY, shade)).toBe(prototype.lit(deltaX, deltaY, shade));
  });
});

describe('facets', () => {
  const palette = ramp(HEX.leafDark, HEX.leafLight);

  it('fan matches the prototype, with and without a vertical gradient', () => {
    expect(fan(OUTLINE, [32, 32], palette)).toBe(prototype.fan(OUTLINE, [32, 32], palette));
    expect(fan(OUTLINE, [32, 32], palette, { top: 10, height: 40, salt: 2 })).toBe(
      prototype.fan(OUTLINE, [32, 32], palette, { top: 10, height: 40, k: 2 }),
    );
  });

  it('fan reads its outline from text too', () => {
    expect(fan('32,14 44,32 32,50 20,32', [32, 32], palette)).toBe(fan(OUTLINE, [32, 32], palette));
  });

  it('shadeFaces matches the prototype and passes attributes through', () => {
    const faces: Point[][] = [TRIANGLE, OUTLINE.slice(0, 3)];

    expect(shadeFaces(faces, [30, 30], palette, { attrs: 'class="facet"' })).toBe(
      prototype.shadeFaces(faces, 30, 30, palette, { attrs: 'class="facet"' }),
    );
  });
});

describe('blob, leaf and limb', () => {
  it.each([1, 31, 91])('blob with seed %i matches the prototype', (seed) => {
    const options = { squash: 0.42, palette: ramp(HEX.grassDark, HEX.grassLight) };

    expect(blob(mulberry32(seed), { x: 130, y: 262, r: 170 }, { sides: 9, ...options })).toBe(
      prototype.blob(prototype.mulberry32(seed), 130, 262, 170, { n: 9, ...options }),
    );
    expect(blob(mulberry32(seed), { x: 30, y: 21, r: 10 }, { gradient: false })).toBe(
      prototype.blob(prototype.mulberry32(seed), 30, 21, 10, { gradient: false }),
    );
  });

  it('leaf matches the prototype', () => {
    expect(
      leaf([130, 152], { length: 46, width: 17, angle: Math.PI + 0.45 }, '#8CCB6E', '#2E7D4A'),
    ).toBe(prototype.leaf(130, 152, 46, 17, Math.PI + 0.45, '#8CCB6E', '#2E7D4A'));
  });

  it.each([1, 51])(
    'limb with seed %i matches the prototype, including its default colours',
    (seed) => {
      const mine = limb({
        from: [130, 194],
        to: [130, 150],
        width: { start: 7, end: 4 },
        rng: mulberry32(seed),
      });
      const theirs = prototype.limb([130, 194], [130, 150], 7, 4, prototype.mulberry32(seed));

      expect(mine).toBe(theirs);
      expect(
        limb({
          from: [0, 0],
          to: [40, 10],
          width: { start: 9, end: 5 },
          rng: mulberry32(seed),
          segments: 2,
        }),
      ).toBe(
        prototype.limb(
          [0, 0],
          [40, 10],
          9,
          5,
          prototype.mulberry32(seed),
          HEX.bark,
          HEX.barkLight,
          2,
        ),
      );
    },
  );
});

describe('nest', () => {
  it('places one svg inside another, wrapped in a group GSAP can move', () => {
    const box = { x: 43, y: 93, width: 34, height: 34 };

    expect(nest(svg('0 0 100 100', ''), box, 'coin')).toBe(
      objects.nest(prototype.svg('0 0 100 100', ''), 43, 93, 34, 34, 'coin'),
    );
    expect(nest(svg('0 0 1 1', ''), box)).not.toContain('data-nest');
  });
});
