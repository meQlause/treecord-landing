import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../src/generated/prototype/three-assets/src/carbon.js';
import { createCarbon } from '../../../../../src/features/landing/three/carbon';

const sources = new Float32Array(Array.from({ length: 60 }, (_item, index) => (index * 7) % 23));

describe('createCarbon', () => {
  const ours = createCarbon({ count: 200, sources });
  const theirs = prototype.createCarbon({ count: 200, sources } as never);
  const attribute = (carbon: typeof ours, name: string) =>
    Array.from(carbon.points.geometry.attributes[name].array);

  it.each(['aStart', 'aTarget', 'aRand'])(
    '%s matches the prototype particle for particle',
    (name) => {
      expect(attribute(ours, name)).toEqual(attribute(theirs as typeof ours, name));
    },
  );

  it('starts invisible and is drawn over clouds and trees', () => {
    expect(ours.uniforms.uProgress.value).toBe(0);
    expect(ours.points.renderOrder).toBe(10);
    expect(ours.points.frustumCulled).toBe(false);
  });

  it('resize keeps point sizes in world units: scale = height * ratio / (2 tan(fov / 2))', () => {
    ours.resize(900, 42, 2);

    expect(ours.uniforms.uScale.value).toBeCloseTo(
      (900 * 2) / (2 * Math.tan((42 * Math.PI) / 360)),
      6,
    );
  });
});
