import { describe, expect, it } from 'vitest';
import { parseRich } from '../../../../../src/features/landing/words/rich.rules';

describe('parseRich', () => {
  it('leaves unmarked text as one piece', () => {
    expect(parseRich('Plain words.')).toEqual([{ kind: 'text', text: 'Plain words.' }]);
  });

  it('splits text around a mark and keeps the punctuation after it', () => {
    expect(parseRich('Anyone can {mark:plant} a tree.')).toEqual([
      { kind: 'text', text: 'Anyone can ' },
      { kind: 'mark', mark: 'mark', text: 'plant' },
      { kind: 'text', text: ' a tree.' },
    ]);
  });

  it('reads a step number', () => {
    expect(parseRich('{num:01} Filmed')).toEqual([
      { kind: 'num', text: '01' },
      { kind: 'text', text: ' Filmed' },
    ]);
  });

  it('reads a swap as the struck word and its replacement', () => {
    expect(parseRich('We pay for {swap:planting|staying alive.}')).toEqual([
      { kind: 'text', text: 'We pay for ' },
      { kind: 'swap', was: 'planting', now: 'staying alive.' },
    ]);
  });

  it('reads several marks in a row, with nothing between them', () => {
    expect(parseRich('{under:a}{ring:b}').map((piece) => piece.kind)).toEqual(['mark', 'mark']);
  });

  it('returns nothing for an empty headline', () => {
    expect(parseRich('')).toEqual([]);
  });
});
