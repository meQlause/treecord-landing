/** An element tree from markup, ready to hand to a timeline builder. */
export function mount(markup: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = markup;

  return host.firstElementChild as HTMLElement;
}
