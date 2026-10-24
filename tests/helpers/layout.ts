import { vi } from 'vitest';

const PAGE = { left: 5, top: 5, width: 600, height: 200 };
const WORD = { left: 10, top: 20, width: 50, height: 30, step: 60 };
const WRAPPED = { top: 60, width: 40 };
const SLIVER = 3; // narrower than the 4 px the engine ignores

const rect = (box: { left: number; top: number; width: number; height: number }): DOMRect =>
  ({
    ...box,
    right: box.left + box.width,
    bottom: box.top + box.height,
    x: box.left,
    y: box.top,
  }) as DOMRect;

/** The position of a marked word among its siblings, so every word gets its own deterministic box. */
const slot = (word: Element): number => {
  const scope = word.closest('.say') ?? word.parentElement;

  return scope ? [...scope.querySelectorAll('.fx')].indexOf(word) : 0;
};

/**
 * jsdom has no layout, so every measurement is zero. This gives marked words fixed boxes: a strike wraps onto
 * a second line, and a swapped-in word has a sliver the engine must skip. Returns the undo.
 */
export function stubLayout(): () => void {
  const bounding = vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function boxOf(this: Element) {
      return this.classList.contains('fx')
        ? rect({ ...WORD, left: WORD.left + slot(this) * WORD.step })
        : rect(PAGE);
    });
  const lines = vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function linesOf(
    this: Element,
  ) {
    if (!this.classList.contains('fx')) {
      return [] as unknown as DOMRectList;
    }
    const first = rect({ ...WORD, left: WORD.left + slot(this) * WORD.step });
    const extra = this.getAttribute('data-fx') === 'strike' ? WRAPPED.width : SLIVER;
    const second = rect({ ...WORD, top: WRAPPED.top, left: WORD.left, width: extra });

    return [first, second] as unknown as DOMRectList;
  });

  return () => {
    bounding.mockRestore();
    lines.mockRestore();
  };
}
