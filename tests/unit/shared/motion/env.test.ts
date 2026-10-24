import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, watchReducedMotion } from '../../../../src/shared/motion/env';

interface Query {
  matches: boolean;
  listeners: ((event: { matches: boolean }) => void)[];
}

const stubQuery = (matches: boolean) => {
  const query: Query = { matches, listeners: [] };
  vi.stubGlobal('matchMedia', () => ({
    matches: query.matches,
    addEventListener: (_type: string, listener: Query['listeners'][number]) =>
      query.listeners.push(listener),
    removeEventListener: (_type: string, listener: Query['listeners'][number]) => {
      query.listeners = query.listeners.filter((existing) => existing !== listener);
    },
  }));

  return query;
};

afterEach(() => vi.unstubAllGlobals());

describe('prefersReducedMotion', () => {
  it('reads the visitor setting at the moment it is asked', () => {
    stubQuery(true);
    expect(prefersReducedMotion()).toBe(true);

    stubQuery(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('watchReducedMotion', () => {
  it('reports each change of the setting while the page is open', () => {
    const query = stubQuery(false);
    const seen: boolean[] = [];

    watchReducedMotion((reduce) => seen.push(reduce));
    query.listeners.forEach((listener) => listener({ matches: true }));
    query.listeners.forEach((listener) => listener({ matches: false }));

    expect(seen).toEqual([true, false]);
  });

  it('stops reporting once it is stopped', () => {
    const query = stubQuery(false);
    const seen: boolean[] = [];

    watchReducedMotion((reduce) => seen.push(reduce))();

    expect(query.listeners).toHaveLength(0);
    expect(seen).toEqual([]);
  });
});
