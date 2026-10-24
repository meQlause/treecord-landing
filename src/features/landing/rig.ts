import type { Rig } from './types';

const START: Rig = {
  px: 0,
  py: 5.5,
  pz: 26,
  lx: 0,
  ly: 6,
  lz: 0,
  dim: 0,
  grow: 1,
  heroGrowth: 0,
  focus: 0,
  carbon: 0,
  cluster: 0,
  clouds: 1,
  wind: 1,
};

/**
 * The camera and scene state the story tweens and the 3D stage reads. It is plain numbers with no three.js in
 * it, so the story can be built before the WebGL chunk has loaded.
 */
export const createRig = (): Rig => ({ ...START });
