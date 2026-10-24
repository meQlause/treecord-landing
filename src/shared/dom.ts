type Styled = HTMLElement | SVGElement;

/** The element some markup is known to contain; a miss is a bug in that markup, so it throws. */
export function pick<T extends Styled = HTMLElement>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) {
    throw new Error(`missing ${selector}`);
  }

  return found;
}
