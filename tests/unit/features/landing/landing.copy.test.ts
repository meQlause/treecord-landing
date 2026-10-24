import { describe, expect, it } from 'vitest';
import { STORY } from '../../../../../svg-assets/src/story.js';
import { COPY } from '../../../../src/features/landing/landing.copy';

// The prototype's own script is the oracle: the approved copy must reach the page word for word (L-3).
const says = (list: { big: string; size?: string }[]) =>
  list.map(({ big, size }) => ({ big, size }));

describe('COPY', () => {
  it('keeps the hero hook, tagline and the seedling lines', () => {
    expect(says(COPY.hero.hook)).toEqual(says(STORY.hero.hook));
    expect(COPY.hero.tagline).toEqual(STORY.hero.tagline);
    expect(says(COPY.seedling.says)).toEqual(says(STORY.seedling.says));
  });

  it('keeps both headlines of each of the three problems', () => {
    expect(COPY.problems.panels.map(says)).toEqual(STORY.problems.panels.map(says));
  });

  it('keeps the proof, pipeline, survival and carbon lines in order', () => {
    expect(says(COPY.proof.says)).toEqual(says(STORY.proof.says));
    expect(says(COPY.pipeline.says)).toEqual(says(STORY.pipeline.says));
    expect(says(COPY.survival.says)).toEqual(says(STORY.survival.says));
    expect(says(COPY.carbon.says)).toEqual(says(STORY.carbon.says));
  });

  it('keeps the roles title, the five role lines and the calls to action', () => {
    expect(COPY.roles.title).toEqual(STORY.roles.title);
    expect(COPY.roles.items.map(({ icon, line }) => [icon, line])).toEqual(STORY.roles.items);
    expect(COPY.roles.cta).toEqual(STORY.roles.cta);
  });

  it('marks every headline with a kind the words engine draws', () => {
    const kinds = new Set(['mark', 'under', 'circle', 'ring', 'alarm', 'strike', 'swap', 'num']);
    const all = JSON.stringify(COPY).match(/\{(\w+):/g) ?? [];

    expect(all.length).toBeGreaterThan(0);
    expect(all.every((open) => kinds.has(open.slice(1, -1)))).toBe(true);
  });
});
