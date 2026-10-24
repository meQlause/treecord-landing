import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BEATS } from '../../../../../src/features/landing/beats';

const ORDER = ['hero', 'seedling', 'problems', 'proof', 'pipeline', 'survival', 'carbon', 'roles'];

// What each beat's build() looks up by selector: a miss would throw on the page, so each must be in the markup.
const NEEDS: Record<string, string[]> = {
  hero: ['.hook .say', '.tagline .say', '.wordmark', 'svg.tc-logo'],
  seedling: ['.copy .say'],
  problems: ['.strip', '.panel', 'svg.tc-forgotten', 'svg.tc-blind', 'svg.tc-certificate'],
  proof: ['.copy .say', 'svg.tc-phone', 'svg.tc-field', 'svg.tc-shield'],
  pipeline: ['.copy .say', 'svg.tc-pipeline', '.stage-box'],
  survival: ['.copy .say', 'svg.tc-milestones', '.glass'],
  carbon: ['.copy .say', 'svg.tc-serial', '.glass'],
  roles: ['.roles figure figcaption', 'svg.tc-icon', '.cta a.btn'],
};

describe('BEATS', () => {
  it('tells the story in order, one beat each', () => {
    expect(BEATS.map((beat) => beat.id)).toEqual(ORDER);
  });

  it('brings every beat in with a camera move except the first', () => {
    expect(BEATS[0].enter).toBeNull();
    expect(BEATS.slice(1).every((beat) => beat.enter !== null)).toBe(true);
  });

  it.each(BEATS.map((beat) => [beat.id, beat] as const))(
    '%s renders what its timeline looks up, with its own beat class',
    (id, beat) => {
      const { container } = render(<beat.Content />);

      expect(beat.cls).toMatch(/^beat--/);
      for (const selector of NEEDS[id]) {
        expect(container.querySelector(selector), selector).not.toBeNull();
      }
    },
  );

  it('shows the problems as three panels of two headlines each', () => {
    const problems = BEATS.find((beat) => beat.id === 'problems');
    const { container } = render(problems ? <problems.Content /> : null);

    expect(container.querySelectorAll('.panel')).toHaveLength(3);
    expect(
      [...container.querySelectorAll('.panel')].map(
        (panel) => panel.querySelectorAll('.say').length,
      ),
    ).toEqual([2, 2, 2]);
  });

  it('offers five roles and the two ways in: fund a tree, or become a planter', () => {
    const roles = BEATS[BEATS.length - 1];
    const { container } = render(<roles.Content />);
    const links = [...container.querySelectorAll('a.btn')].map((link) => link.getAttribute('href'));

    expect(container.querySelectorAll('.roles figure')).toHaveLength(5);
    expect(links).toEqual(['/#/campaigns', '/#/sign-in?account=planter&returnTo=%2Fapp']);
  });
});
