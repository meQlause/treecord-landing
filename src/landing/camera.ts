import type { gsap } from 'gsap';
import type { BeatId, Enter, Pose } from './types';

/** Camera moves between beats (timeline units). */
export const MOVE = 0.95;

const OUT_SHARE = 0.6;
const IN_SHARE = 0.65;
const IN_DELAY = 0.35;
const PERCENT = 100;
const EASE_OUT = 'power2.in';
const EASE_IN = 'power2.out';
const EASE_PAN = 'power2.inOut';

// Camera poses at the start of each beat (rig keys, see stage3d.ts). Pans move in x, zooms in distance.
// The 2D beats (problems, proof, pipeline) lift the camera above the canopy and look at the horizon:
// with the fog pulled in, the backdrop turns to calm paper and the SVG reads cleanly.
export const POSES: Record<BeatId, Pose> = {
  hero: {
    px: 0,
    py: 5.5,
    pz: 26,
    lx: 0,
    ly: 6,
    lz: 0,
    dim: 0,
    heroGrowth: 0,
    focus: 0,
    carbon: 0,
    cluster: 0,
    clouds: 1,
  },
  seedling: { px: 1.0, py: 2.6, pz: 4.6, lx: -1.1, ly: 0.1, lz: 0, dim: 0.55, focus: 1 },
  problems: { px: 4, py: 18, pz: 30, lx: 4, ly: 18, lz: 0, dim: 1, focus: 0 },
  proof: { px: 18, py: 18, pz: 24, lx: 18, ly: 18, lz: 0, dim: 1 },
  pipeline: { px: 20, py: 18, pz: 24, lx: 20, ly: 18, lz: 0, dim: 1 },
  survival: { px: 3.5, py: 3.2, pz: 13, lx: -2.8, ly: 3.4, lz: 0, dim: 0.08, focus: 1 }, // tree framed right, words left
  carbon: {
    px: 0,
    py: 24,
    pz: 40,
    lx: 0,
    ly: 10,
    lz: -16,
    dim: 0,
    focus: 0,
    cluster: 1,
    clouds: 0.3,
  }, // thin clouds: the coin must read
  roles: {
    px: 0,
    py: 5,
    pz: 26,
    lx: 0,
    ly: 10,
    lz: 0,
    dim: 0.45,
    cluster: 0,
    carbon: 0,
    clouds: 1,
  },
};

type Move = (timeline: gsap.core.Timeline, out: Element, inn: Element, start: number) => void;

const zoom =
  ({ outScale, inScale }: { outScale: number; inScale: number }): Move =>
  (timeline, out, inn, start) => {
    timeline
      .to(out, { scale: outScale, autoAlpha: 0, duration: MOVE * OUT_SHARE, ease: EASE_OUT }, start)
      .fromTo(
        inn,
        { scale: inScale, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: MOVE * IN_SHARE, ease: EASE_IN },
        start + MOVE * IN_DELAY,
      );
  };

const pan =
  (direction: 1 | -1): Move =>
  (timeline, out, inn, start) => {
    timeline
      .to(out, { xPercent: -direction * PERCENT, duration: MOVE, ease: EASE_PAN }, start)
      .fromTo(
        inn,
        { xPercent: direction * PERCENT, autoAlpha: 1 },
        { xPercent: 0, duration: MOVE, ease: EASE_PAN },
        start,
      );
  };

// Incoming beats always settle at scale 1, so text is never upscaled.
export const ENTER: Record<Enter, Move> = {
  zoomIn: zoom({ outScale: 1.7, inScale: 0.6 }),
  zoomOut: zoom({ outScale: 0.6, inScale: 1.45 }),
  panRight: pan(1),
  panLeft: pan(-1),
};
