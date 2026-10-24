import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async () => (await import('../../../../src/features/landing/landing.links')).LINKS;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('LINKS', () => {
  it('leads to the app sign-in on the site the build names', async () => {
    vi.stubEnv('VITE_APP_URL', 'https://app.example/');

    expect(await load()).toEqual({ join: 'https://app.example/sign-in' });
  });

  it('is the path alone when no app site is named, for a landing hosted beside the app', async () => {
    vi.stubEnv('VITE_APP_URL', '');

    expect(await load()).toEqual({ join: '/sign-in' });
  });
});
