import { describe, expect, it } from 'vitest';
import { createGround } from '../../../../../src/features/landing/three/ground';

const SEGMENTS = 20;
const GRID = Array.from({ length: 21 }, (_item, step) => (step - 10) * 12);
const SAMPLES = GRID.flatMap((posX) => GRID.map((posZ): [number, number] => [posX, posZ]));

describe('createGround', () => {
  const ground = createGround({ segments: SEGMENTS });
  const heights = (made: typeof ground) => SAMPLES.map(([posX, posZ]) => made.heightAt(posX, posZ));

  it('is the same ground for the same seed and a different ground for another', () => {
    expect(heights(createGround({ segments: SEGMENTS }))).toEqual(heights(ground));
    expect(heights(createGround({ segments: SEGMENTS, seed: 4 }))).not.toEqual(heights(ground));
  });

  it('is flat where the hero tree stands: zero at the origin and nearly so around it', () => {
    expect(ground.heightAt(0, 0)).toBeCloseTo(0);
    expect(Math.abs(ground.heightAt(3, 2))).toBeLessThan(0.05);
  });

  it('rolls further out, gently: hills exist but stay within a few units', () => {
    const all = heights(ground);

    expect(Math.max(...all.map(Math.abs))).toBeGreaterThan(0.3);
    expect(all.every((height) => Math.abs(height) < 5)).toBe(true);
  });

  it('builds a low-poly mesh of separate triangles, each with a colour between 0 and 1', () => {
    const { position, color } = ground.mesh.geometry.attributes;

    expect(ground.mesh.name).toBe('ground');
    expect(position.count).toBe(SEGMENTS * SEGMENTS * 2 * 3);
    expect(color.count).toBe(position.count);
    expect(Array.from(color.array).every((value) => value >= 0 && value <= 1)).toBe(true);
  });

  it('puts the vertices on the surface heightAt describes, so trees can stand on it', () => {
    const { position } = ground.mesh.geometry.attributes;
    const sample = Array.from({ length: 60 }, (_item, index) => index * 37);
    const offSurface = sample.filter(
      (vertex) =>
        Math.abs(
          position.getY(vertex) - ground.heightAt(position.getX(vertex), position.getZ(vertex)),
        ) > 1e-4,
    );

    expect(offSurface).toEqual([]);
  });

  it('disposes without throwing', () => {
    expect(() => createGround({ segments: 4 }).dispose()).not.toThrow();
  });
});
