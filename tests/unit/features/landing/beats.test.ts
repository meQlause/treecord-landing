import { describe, expect, it } from 'vitest';
import { BEATS } from '../../../../src/features/landing/beats';

const ORDER = ['hero', 'seedling', 'problems', 'proof', 'pipeline', 'survival', 'carbon', 'roles'];

describe('BEATS', () => {
  it('tells the story in order, one beat each', () => {
    expect(BEATS.map((beat) => beat.id)).toEqual(ORDER);
  });

  it('brings every beat in with a camera move except the first', () => {
    expect(BEATS[0].enter).toBeNull();
    expect(BEATS.slice(1).every((beat) => beat.enter !== null)).toBe(true);
  });

  it.each(BEATS.map((beat) => [beat.id, beat] as const))(
    '%s renders markup with its own beat class',
    (_id, beat) => {
      const html = beat.html();

      expect(html.length).toBeGreaterThan(0);
      expect(html).not.toContain('undefined');
      expect(beat.cls).toMatch(/^beat--/);
    },
  );

  it('the last beat offers the two ways in: browse campaigns and sign in as a planter', () => {
    const root = document.createElement('div');
    root.innerHTML = BEATS[BEATS.length - 1].html();
    const links = [...root.querySelectorAll('a.btn')].map((link) => link.getAttribute('href'));

    expect(links).toEqual(['/#/campaigns', '/#/sign-in?account=planter&returnTo=%2Fapp']);
  });
});
