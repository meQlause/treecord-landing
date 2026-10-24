import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Art } from '../../../../src/shared/art/art';
import { coinSVG } from '../../../../src/shared/art/coin';
import { shieldSVG } from '../../../../src/shared/art/shield';

describe('Art', () => {
  it('mounts the generated <svg> as a real SVG element inside a space-free wrapper', () => {
    const { container } = render(<Art markup={coinSVG()} />);
    const svg = container.querySelector('svg');

    expect(container.querySelector('span.art')).not.toBeNull();
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(svg?.getAttribute('class')).toBe('tc-coin tc-coin--gold');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps every facet the generator drew', () => {
    const { container } = render(<Art markup={shieldSVG()} />);

    expect(container.querySelectorAll('polygon').length).toBeGreaterThan(0);
    expect(container.querySelector('.check')).not.toBeNull();
  });

  it('swaps the drawing when the markup changes', () => {
    const { container, rerender } = render(<Art markup={coinSVG()} />);

    rerender(<Art markup={shieldSVG()} />);

    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('tc-shield');
  });
});
