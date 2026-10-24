import type { Timeline } from './types';

type Styled = HTMLElement | SVGElement;

/** The element a beat's markup is known to contain; a miss is a bug in the markup, so it throws. */
export function pick<T extends Styled = HTMLElement>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) {
    throw new Error(`landing: missing ${selector}`);
  }

  return found;
}

/** Put an asset timeline (paused, 0..1) into a timeline at `start`, stretched to `length`. */
export function place(timeline: Timeline, asset: Timeline, start = 0, length = 1): Timeline {
  return timeline.add(asset.paused(false).duration(length), start);
}
