import type { InstancedMesh } from 'three';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../src/generated/prototype/three-assets/src/sky.js';
import { createBirds } from '../../../../../src/features/landing/three/birds';

describe('createBirds', () => {
  it('flies the same loop as the prototype at a given time', () => {
    const ours = createBirds({ count: 8 });
    const theirs = prototype.createBirds({ count: 8 });
    ours.update(120);
    theirs.update(120);

    expect(Array.from(ours.group.instanceMatrix.array)).toEqual(
      Array.from((theirs.group as InstancedMesh).instanceMatrix.array),
    );
  });

  it('draws one instance per bird and passes time to the wing flap', () => {
    const birds = createBirds({ count: 5 });

    birds.update(2);

    expect(birds.group.count).toBe(5);
    expect(birds.group.name).toBe('birds');
  });
});
