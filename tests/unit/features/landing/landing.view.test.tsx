import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BEATS } from '../../../../src/features/landing/beats';
import { COPY } from '../../../../src/features/landing/landing.copy';
import { LandingView } from '../../../../src/features/landing/landing.view';

const html = renderToString(<LandingView />);
const page = new DOMParser().parseFromString(html, 'text/html');

describe('LandingView', () => {
  it('renders in plain Node: one section per beat, in story order, inside the stage', () => {
    const ids = [...page.querySelectorAll('#stage > section.beat')].map((beat) => beat.id);

    expect(ids).toEqual(BEATS.map((beat) => beat.id));
  });

  it('puts the skip link first and sends it to a footer that can take focus', () => {
    const skip = page.querySelector('a.skip');
    const footer = page.querySelector('footer#end');

    expect(page.body.firstElementChild).toBe(skip);
    expect(skip?.getAttribute('href')).toBe('#end');
    expect(footer?.getAttribute('tabindex')).toBe('-1');
    expect(footer?.textContent).toBe(COPY.shell.name + COPY.shell.footer);
  });

  it('is the article: no pinned layout until the client adds it on mount', () => {
    expect(page.querySelector('[data-motion]')).toBeNull();
    expect(page.querySelector('#stage')?.getAttribute('aria-label')).toBe(COPY.shell.label);
  });

  it('carries the headlines as text, and the 3D host and progress rail the client fills in', () => {
    expect(page.querySelector('#hero .hook')?.textContent).toContain('Anyone can plant a tree.');
    expect(page.querySelector('#stage > .gl')).not.toBeNull();
    expect(page.querySelector('#stage > .rail')).not.toBeNull();
  });
});
