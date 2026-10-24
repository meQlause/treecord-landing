import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COPY } from '../../../../../src/features/landing/landing.copy';
import { Copy, Rich } from '../../../../../src/features/landing/words/rich';

const KINDS = ['mark', 'under', 'circle', 'ring', 'alarm', 'strike'];

const everyLine = [
  ...COPY.hero.hook,
  COPY.hero.tagline,
  ...COPY.seedling.says,
  ...COPY.problems.panels.flat(),
  ...COPY.proof.says,
  ...COPY.pipeline.says,
  ...COPY.survival.says,
  ...COPY.carbon.says,
  COPY.roles.title,
  { big: COPY.roles.cta.big },
  ...COPY.roles.items.map((item) => ({ big: item.line })),
].map((say) => say.big);

describe('Rich', () => {
  it.each(KINDS)('wraps a %s word in the span the marks engine measures', (kind) => {
    const { container } = render(<Rich text={`Before {${kind}:the word} after.`} />);

    const span = container.querySelector(`span.fx[data-fx=${kind}]`);
    expect(span?.textContent).toBe('the word');
    expect(container.textContent).toBe('Before the word after.');
  });

  it('keeps the text around a mark exactly as written, spaces included', () => {
    const { container } = render(<Rich text="Anyone can {mark:plant} a tree." />);

    expect(container.textContent).toBe('Anyone can plant a tree.');
    expect(container.querySelectorAll('.fx')).toHaveLength(1);
  });

  it('shows a step number as a .num span, not as a drawn mark', () => {
    const { container } = render(<Rich text="{num:01} Filmed and signed." />);

    expect(container.querySelector('span.num')?.textContent).toBe('01');
    expect(container.querySelectorAll('.fx')).toHaveLength(0);
  });

  it('shows a swap as the struck word, a space, then the new word in green', () => {
    const { container } = render(<Rich text="{swap:planting|staying alive.}" />);

    expect(container.querySelector('[data-fx=strike]')?.textContent).toBe('planting');
    expect(container.querySelector('.fx--new[data-fx=new]')?.textContent).toBe('staying alive.');
    expect(container.textContent).toBe('planting staying alive.');
  });

  it('renders a plain headline as text with nothing to draw', () => {
    const { container } = render(<Rich text="Plain words." />);

    expect(container.textContent).toBe('Plain words.');
    expect(container.querySelector('span')).toBeNull();
  });

  it('leaves no markup braces on the page for any headline in the story', () => {
    for (const text of everyLine) {
      const { container, unmount } = render(<Rich text={text} />);

      expect(container.textContent, text).not.toMatch(/[{}]/);
      unmount();
    }
  });
});

describe('Copy', () => {
  it('renders each headline as a .say holding a .big line, and a medium one as big--m', () => {
    const says = [COPY.hero.hook[0], COPY.hero.tagline];

    const { container } = render(<Copy says={says} className="hook" />);

    const lines = [...container.querySelectorAll('.say > .big')];
    expect(container.firstElementChild?.className).toBe('copy hook');
    expect(lines.map((line) => line.className)).toEqual(['big', 'big big--m']);
    expect(lines[0].textContent).toBe('Anyone can plant a tree.');
    expect(lines[1].textContent).toBe('Every tree, proven.');
  });

  it('is a plain .copy without a class name', () => {
    const { container } = render(<Copy says={COPY.seedling.says} />);

    expect(container.firstElementChild?.className).toBe('copy');
  });

  it('renders the marks of its headlines, ready to be drawn', () => {
    const { container } = render(<Copy says={COPY.hero.hook} />);

    const kinds = [...container.querySelectorAll('.fx')].map((span) =>
      span.getAttribute('data-fx'),
    );
    expect(kinds).toEqual(['mark', 'circle']);
  });

  it('makes only the first headline a heading, so a beat opens one section of the outline', () => {
    const { container } = render(<Copy says={COPY.proof.says} heading="h2" />);
    const lines = [...container.querySelectorAll('.big')].map((line) => line.tagName);

    expect(lines[0]).toBe('H2');
    expect(lines.slice(1).every((tag) => tag === 'P')).toBe(true);
  });

  it('can make the first headline the h1 of the page', () => {
    const { container } = render(<Copy says={COPY.hero.hook} heading="h1" />);

    expect(container.querySelector('h1.big')?.textContent).toBe('Anyone can plant a tree.');
  });

  it('renders every headline as a paragraph when no heading is asked for', () => {
    const { container } = render(<Copy says={COPY.seedling.says} />);

    expect([...container.querySelectorAll('.big')].every((line) => line.tagName === 'P')).toBe(
      true,
    );
  });
});
