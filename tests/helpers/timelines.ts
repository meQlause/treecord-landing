import type { gsap } from 'gsap';

/**
 * A timeline as plain data: every tween's start, length, targets and vars. Elements are named by their position
 * in the root, so a timeline built on the prototype's markup and one built on ours can be compared with toEqual.
 * Function-valued vars (random offsets, per-element colours) are compared by presence, not value.
 */
export function describeTimeline(timeline: gsap.core.Timeline, root: Element): unknown[] {
  const elements = [...root.querySelectorAll('*')];
  const name = (target: unknown): string =>
    target instanceof Element ? `element ${elements.indexOf(target)}` : 'object';
  const replacer = (_key: string, value: unknown): unknown => {
    if (typeof value === 'function') {
      return '[function]';
    }
    if (typeof value === 'object' && value !== null && '_dp' in value) {
      return '[animation]'; // gsap's own back-reference to the timeline holding the tween
    }

    return value instanceof Element ? name(value) : value;
  };

  return timeline.getChildren(true, true, true).map((child) => {
    const vars = child.vars as Record<string, unknown>;

    return {
      start: child.startTime(),
      length: child.duration(),
      targets: (child as gsap.core.Tween).targets?.().map(name),
      vars: JSON.parse(JSON.stringify(vars, replacer)) as unknown,
    };
  });
}

/** An element tree from markup, ready to hand to a timeline builder. */
export function mount(markup: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = markup;

  return host.firstElementChild as HTMLElement;
}
