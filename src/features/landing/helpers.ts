import type { Timeline } from './types';

/** Put an asset timeline (paused, 0..1) into a timeline at `start`, stretched to `length`. */
export function place(timeline: Timeline, asset: Timeline, start = 0, length = 1): Timeline {
  return timeline.add(asset.paused(false).duration(length), start);
}
