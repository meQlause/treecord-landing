import { describe, expect, it } from 'vitest';
import { pick } from '../../../src/shared/dom';

describe('pick', () => {
  it('returns the element the selector names', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p class="copy"></p>';

    expect(pick(root, '.copy')).toBe(root.querySelector('p'));
  });

  it('throws when the markup lacks the element, naming the selector', () => {
    const root = document.createElement('div');

    expect(() => pick(root, '.missing')).toThrow('.missing');
  });
});
