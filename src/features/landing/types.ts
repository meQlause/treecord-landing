import type { gsap } from 'gsap';

/** Camera pose + scene state. p* = camera position, l* = look-at target. */
export interface Rig {
  px: number;
  py: number;
  pz: number;
  lx: number;
  ly: number;
  lz: number;
  dim: number;
  grow: number;
  heroGrowth: number;
  focus: number;
  carbon: number;
  cluster: number;
  clouds: number;
  wind: number;
}

export type Pose = Partial<Rig>;
export type Timeline = gsap.core.Timeline;
export type Enter = 'zoomIn' | 'zoomOut' | 'panRight' | 'panLeft';
export type BeatId =
  'hero' | 'seedling' | 'problems' | 'proof' | 'pipeline' | 'survival' | 'carbon' | 'roles';

export interface Beat {
  id: BeatId;
  cls: string;
  /** The camera move that brings the beat in; the first beat has none. */
  enter: Enter | null;
  html: () => string;
  build: (timeline: Timeline, root: HTMLElement, rig: Rig, motion: boolean) => void;
}
