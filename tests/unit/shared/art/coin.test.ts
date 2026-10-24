import { describe, expect, it } from 'vitest';
import { coinSVG } from '../../../../src/shared/art/coin';
import { mount } from '../../../helpers/timelines';

const polygons = (markup: string): number => markup.split('<polygon').length - 1;

describe('coin', () => {
  it.each(['gold', 'green'] as const)(
    'the %s coin is a decorative 100 x 100 svg named for its tone',
    (tone) => {
      const root = mount(coinSVG({ tone }));

      expect(root.getAttribute('viewBox')).toBe('0 0 100 100');
      expect(root.getAttribute('class')).toBe(`tc-coin tc-coin--${tone}`);
      expect(root.getAttribute('aria-hidden')).toBe('true');
      expect(root.getAttribute('focusable')).toBe('false');
      expect(root.querySelectorAll('.coin-body')).toHaveLength(1);
    },
  );

  it('is the gold payout coin by default', () => {
    expect(coinSVG()).toBe(coinSVG({ tone: 'gold' }));
  });

  it('is cut from the same 32 facets in either tone: a 10-side rim of 20, a 10-facet face, a 2-facet leaf', () => {
    expect(polygons(coinSVG({ tone: 'gold' }))).toBe(32);
    expect(polygons(coinSVG({ tone: 'green' }))).toBe(32);
  });

  it('draws the two tones in different colours, and the same coin the same way twice', () => {
    expect(coinSVG({ tone: 'gold' })).not.toBe(coinSVG({ tone: 'green' }));
    expect(coinSVG({ tone: 'green' })).toBe(coinSVG({ tone: 'green' }));
  });
});
