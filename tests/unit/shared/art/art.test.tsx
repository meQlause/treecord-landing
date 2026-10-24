import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Art } from '../../../../src/shared/art/art';
import { blindFundingSVG } from '../../../../src/shared/art/blind-funding';
import { certificateSVG } from '../../../../src/shared/art/certificate';
import { fieldCheckSVG } from '../../../../src/shared/art/field-check';
import { forgottenSVG } from '../../../../src/shared/art/forgotten';
import { ICONS, iconSVG } from '../../../../src/shared/art/icons';
import { logoSVG } from '../../../../src/shared/art/logo';
import { milestonesSVG } from '../../../../src/shared/art/milestones';
import { phoneSVG } from '../../../../src/shared/art/phone';
import { pipelineSVG } from '../../../../src/shared/art/pipeline';
import { serialSVG } from '../../../../src/shared/art/serial';
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

// foundation.md §5: one svg per asset stays under about 1,000 nodes, so the page stays light to paint and scrub
const NODE_BUDGET = 1000;
const ASSETS: [string, () => string][] = [
  ['coin', coinSVG],
  ['blind funding', blindFundingSVG],
  ['certificate', certificateSVG],
  ['forgotten scene', forgottenSVG],
  ['field check', fieldCheckSVG],
  ['logo', logoSVG],
  ['milestones', milestonesSVG],
  ['phone', phoneSVG],
  ['pipeline', pipelineSVG],
  ['serial', serialSVG],
  ...(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((name): [string, () => string] => [
    `${name} icon`,
    () => iconSVG(name),
  ]),
];

describe('the art stays light', () => {
  it.each(ASSETS)('%s is under the node budget', (_name, draw) => {
    const host = document.createElement('div');
    host.innerHTML = draw();

    expect(host.querySelectorAll('*').length).toBeLessThan(NODE_BUDGET);
  });

  it('keeps the whole pipeline, the largest asset, well inside it', () => {
    const host = document.createElement('div');
    host.innerHTML = pipelineSVG();

    expect(host.querySelectorAll('polygon').length).toBeGreaterThan(0);
    expect(host.querySelectorAll('*').length).toBeLessThan(NODE_BUDGET);
  });
});
