// What every asset timeline shares: the named eases and the marker that gives it a length of exactly 1.
import { gsap } from 'gsap';

export type Timeline = gsap.core.Timeline;

export const EASE = {
  out: 'power2.out',
  in: 'power2.in',
  inOut: 'power2.inOut',
  strongOut: 'power3.out',
  soft: 'sine.inOut',
  none: 'none',
} as const;

/** The assets are scrubbed from 0 to 1, so each timeline is padded to end exactly there. */
export const settle = (timeline: Timeline): Timeline => timeline.set({}, {}, 1);

/** A paused timeline: the story's master timeline plays it, so it never runs on its own. */
export const paused = (vars: gsap.TimelineVars = {}): Timeline =>
  gsap.timeline({ paused: true, ...vars });
