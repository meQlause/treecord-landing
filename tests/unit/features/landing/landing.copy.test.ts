import { describe, expect, it } from 'vitest';
import { COPY, type Say } from '../../../../src/features/landing/landing.copy';
import { parseRich } from '../../../../src/features/landing/words/rich.rules';
import { ICONS } from '../../../../src/shared/art/icons';

// The copy is the approved script, and it now lives only here, so these tests pin its shape (every headline can
// be drawn by the words engine) and a few key sentences, not a second copy of all the text.
const KINDS = ['mark', 'under', 'circle', 'ring', 'alarm', 'strike', 'swap', 'num'];

const groups: [string, Say[]][] = [
  ['hero hook', COPY.hero.hook],
  ['hero tagline', [COPY.hero.tagline]],
  ['seedling', COPY.seedling.says],
  ...COPY.problems.panels.map((panel, index): [string, Say[]] => [
    `problems panel ${index + 1}`,
    panel,
  ]),
  ['proof', COPY.proof.says],
  ['pipeline', COPY.pipeline.says],
  ['survival', COPY.survival.says],
  ['carbon', COPY.carbon.says],
  ['roles title', [COPY.roles.title]],
];
const all = groups.flatMap(([, says]) => says);

describe('COPY headlines', () => {
  it.each(groups)('%s: every headline has words and a known size', (_name, says) => {
    expect(says.length).toBeGreaterThan(0);
    for (const say of says) {
      expect(say.big.trim().length).toBeGreaterThan(0);
      expect([undefined, 'm']).toContain(say.size);
    }
  });

  it.each(groups)('%s: headlines are unique, since they are the React keys', (_name, says) => {
    expect(new Set(says.map((say) => say.big)).size).toBe(says.length);
  });

  it('only uses marks the words engine knows how to draw', () => {
    const used = all.flatMap((say) => [...say.big.matchAll(/\{(\w+):/g)].map((found) => found[1]));

    expect(used.length).toBeGreaterThan(0);
    expect(used.every((kind) => KINDS.includes(kind))).toBe(true);
  });

  it('closes every mark: no stray brace is left once the marks are read', () => {
    for (const say of all) {
      const text = parseRich(say.big)
        .filter((piece) => piece.kind === 'text')
        .map((piece) => piece.text)
        .join('');

      expect(text, say.big).not.toMatch(/[{}]/);
    }
  });

  it('gives a swap both its words, the struck one and the one that replaces it', () => {
    const swaps = all.flatMap((say) => parseRich(say.big).filter((piece) => piece.kind === 'swap'));

    expect(swaps.length).toBeGreaterThan(0);
    for (const swap of swaps) {
      expect(swap.kind === 'swap' && swap.was.length > 0 && swap.now.length > 0).toBe(true);
    }
  });

  it('keeps the key sentences of the story', () => {
    expect(COPY.hero.hook[0].big).toBe('Anyone can {mark:plant} a tree.');
    expect(COPY.hero.tagline.big).toBe('Every tree, {under:proven}.');
    expect(COPY.survival.says[0].big).toBe('We pay for {swap:planting|staying alive.}');
    expect(COPY.carbon.says[1].big).toBe('Every tonne has exactly {circle:one} owner.');
    expect(COPY.roles.title.big).toBe('One proof. {mark:Five} reasons to believe it.');
  });
});

describe('COPY structure', () => {
  it('has three problems of two headlines each, and four proof lines', () => {
    expect(COPY.problems.panels).toHaveLength(3);
    expect(COPY.problems.panels.every((panel) => panel.length === 2)).toBe(true);
    expect(COPY.proof.says).toHaveLength(4);
  });

  it('numbers the pipeline steps 01 to 04 after its opening line', () => {
    const [opening, ...steps] = COPY.pipeline.says;

    expect(opening.big).not.toContain('{num:');
    expect(steps.map((say) => say.big.match(/\{num:(\d+)\}/)?.[1])).toEqual([
      '01',
      '02',
      '03',
      '04',
    ]);
  });

  it('shows five roles, each with an icon that exists and a line of its own', () => {
    const { items } = COPY.roles;

    expect(items).toHaveLength(5);
    expect(new Set(items.map((item) => item.icon)).size).toBe(5);
    expect(items.every((item) => item.icon in ICONS)).toBe(true);
    expect(items.every((item) => item.line.trim().length > 0)).toBe(true);
  });

  it('has a call to action with a headline and two buttons', () => {
    const { cta } = COPY.roles;

    expect(cta.big.length).toBeGreaterThan(0);
    expect([cta.primary, cta.secondary].every((label) => label.trim().length > 0)).toBe(true);
    expect(cta.primary).not.toBe(cta.secondary);
  });

  it('has the words around the story: skip link, label, name and footer', () => {
    const { shell } = COPY;

    expect(Object.values(shell).every((text) => text.trim().length > 0)).toBe(true);
    expect(shell.footer).toBe('Every tree, proven.');
  });
});
