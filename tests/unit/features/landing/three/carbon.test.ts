import { describe, expect, it } from 'vitest';
import { createCarbon } from '../../../../../src/features/landing/three/carbon';

const COUNT = 200;
const RADIUS = 4.5;
const RIM_SHARE = 0.62;
// three crown tops to rise from, (x, y, z) each
const TOPS = [
  [0, 5, 0],
  [10, 6, -4],
  [-8, 5, 3],
];
const SOURCES = new Float32Array(TOPS.flat());
const SIDEWAYS = 0.3; // the spawn jitter around a top
const UPRIGHT = 0.2;
const RIM_JITTER = 0.18;
const FACE_REACH = 0.72;
const DEPTH = 0.15;
const SLACK = 1e-4;

type Cloud = ReturnType<typeof createCarbon>;

const attribute = (carbon: Cloud, name: string) =>
  Array.from(carbon.points.geometry.attributes[name].array);
const triples = (carbon: Cloud, name: string) =>
  Array.from({ length: COUNT }, (_item, index) =>
    attribute(carbon, name).slice(index * 3, index * 3 + 3),
  );

describe('createCarbon', () => {
  const carbon = createCarbon({ count: COUNT, sources: SOURCES });

  it('is the same cloud for the same seed and a different one for another', () => {
    const again = createCarbon({ count: COUNT, sources: SOURCES });
    const other = createCarbon({ count: COUNT, sources: SOURCES, seed: 6 });

    expect(attribute(again, 'aStart')).toEqual(attribute(carbon, 'aStart'));
    expect(attribute(other, 'aStart')).not.toEqual(attribute(carbon, 'aStart'));
  });

  it('has one particle per count, with start, target and random attributes for each', () => {
    const { attributes } = carbon.points.geometry;

    expect(attributes.aStart.count).toBe(COUNT);
    expect(attributes.aTarget.count).toBe(COUNT);
    expect(attributes.aRand.count).toBe(COUNT);
    expect(attributes.aRand.itemSize).toBe(4);
  });

  it('starts every particle within the spawn jitter of one of the crown tops it was given', () => {
    const stray = triples(carbon, 'aStart').filter(
      ([posX, posY, posZ]) =>
        !TOPS.some(
          ([topX, topY, topZ]) =>
            Math.abs(posX - topX) <= SIDEWAYS + SLACK &&
            Math.abs(posY - topY) <= UPRIGHT + SLACK &&
            Math.abs(posZ - topZ) <= SIDEWAYS + SLACK,
        ),
    );

    expect(stray).toEqual([]);
  });

  it('gathers the first 62% on the rim of a coin of the given radius, the rest on its face', () => {
    const rimCount = Math.ceil(COUNT * RIM_SHARE);
    const reach = triples(carbon, 'aTarget').map(([posX, posY]) => Math.hypot(posX, posY));

    expect(
      reach
        .slice(0, rimCount)
        .every((distance) => Math.abs(distance - RADIUS) <= RIM_JITTER + SLACK),
    ).toBe(true);
    expect(reach.slice(rimCount).every((distance) => distance <= RADIUS * FACE_REACH + SLACK)).toBe(
      true,
    );
  });

  it('keeps the coin thin: its depth stays within a fraction of a unit', () => {
    const depths = triples(carbon, 'aTarget').map(([, , posZ]) => posZ);

    expect(depths.every((depth) => Math.abs(depth) <= DEPTH + SLACK)).toBe(true);
  });

  it('gives each particle random values between 0 and 1', () => {
    expect(attribute(carbon, 'aRand').every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('starts invisible and is drawn over clouds and trees', () => {
    expect(carbon.uniforms.uProgress.value).toBeCloseTo(0);
    expect(carbon.points.renderOrder).toBe(10);
    expect(carbon.points.frustumCulled).toBe(false);
  });

  it('resize keeps point sizes in world units: scale = height * ratio / (2 tan(fov / 2))', () => {
    carbon.resize(900, 42, 2);

    expect(carbon.uniforms.uScale.value).toBeCloseTo(
      (900 * 2) / (2 * Math.tan((42 * Math.PI) / 360)),
      6,
    );
  });

  it('disposes without throwing', () => {
    expect(() => createCarbon({ count: 10, sources: SOURCES }).dispose()).not.toThrow();
  });
});
