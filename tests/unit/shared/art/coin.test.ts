import { describe, expect, it } from 'vitest';
import * as prototype from '../../../../src/generated/prototype/svg-assets/src/objects.js';
import { coinSVG } from '../../../../src/shared/art/coin';

// The prototype's own module is the oracle: same markup byte for byte.
describe('coin', () => {
  it.each(['gold', 'green'] as const)('draws the %s coin like the prototype', (tone) => {
    expect(coinSVG({ tone })).toBe(prototype.coinSVG({ tone }));
  });

  it('is the gold payout coin by default', () => {
    expect(coinSVG()).toBe(coinSVG({ tone: 'gold' }));
    expect(coinSVG()).toContain('tc-coin--gold');
  });
});
