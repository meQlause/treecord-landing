import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../../src/generated/prototype/svg-assets/src/words.js';
import { COPY } from '../../../../../src/features/landing/landing.copy';
import { Copy, Rich } from '../../../../../src/features/landing/words/rich';

// The prototype's own words module is the oracle: the same DOM for the same headline.
const lines = [
  COPY.hero.hook[0].big,
  COPY.proof.says[0].big,
  COPY.proof.says[1].big,
  COPY.pipeline.says[1].big,
  COPY.survival.says[0].big,
  COPY.roles.items[0].line,
];

describe('Rich', () => {
  it.each(lines)('renders %s like the prototype', (text) => {
    const theirs = document.createElement('div');
    theirs.innerHTML = prototype.rich(text);
    const { container } = render(<Rich text={text} />);

    expect(container.innerHTML).toBe(theirs.innerHTML);
  });

  it('shows a swap as the struck word, a space, then the new word in green', () => {
    const { container } = render(<Rich text="{swap:planting|staying alive.}" />);

    expect(container.querySelector('[data-fx=strike]')?.textContent).toBe('planting');
    expect(container.querySelector('.fx--new')?.textContent).toBe('staying alive.');
  });
});

describe('Copy', () => {
  it('renders each headline as a .say with a .big line, medium size included', () => {
    const says = [COPY.hero.hook[0], COPY.hero.tagline];
    const theirs = document.createElement('div');
    theirs.innerHTML = prototype.copyHTML(says, 'hook');
    const { container } = render(<Copy says={says} className="hook" />);
    const ours = container.firstElementChild;

    expect(ours?.className).toBe('copy hook');
    expect(ours?.innerHTML).toBe(theirs.firstElementChild?.innerHTML);
  });

  it('is a plain .copy without a class name', () => {
    const { container } = render(<Copy says={COPY.seedling.says} />);

    expect(container.firstElementChild?.className).toBe('copy');
  });

  it('makes only the first headline a heading, so a beat opens one section of the outline', () => {
    const { container } = render(<Copy says={COPY.proof.says} heading="h2" />);
    const lines = [...container.querySelectorAll('.big')].map((line) => line.tagName);

    expect(lines[0]).toBe('H2');
    expect(lines.slice(1).every((tag) => tag === 'P')).toBe(true);
  });

  it('renders every headline as a paragraph when no heading is asked for', () => {
    const { container } = render(<Copy says={COPY.seedling.says} />);

    expect([...container.querySelectorAll('.big')].every((line) => line.tagName === 'P')).toBe(
      true,
    );
  });
});
