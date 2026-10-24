import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async () => (await import('../../../../src/features/landing/landing.links')).LINKS;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('LINKS', () => {
  it('keeps the mockup hash routes by default, as the prototype has them', async () => {
    expect(await load()).toEqual({
      fund: '/#/campaigns',
      becomePlanter: '/#/sign-in?account=planter&returnTo=%2Fapp',
    });
  });

  it('takes the app path routes when built to be hosted beside it', async () => {
    vi.stubEnv('VITE_APP_ROUTES', 'path');

    expect(await load()).toEqual({ fund: '/campaigns', becomePlanter: '/sign-in?returnTo=%2Fapp' });
  });

  it('only ever points at an internal path, never at another site', async () => {
    vi.stubEnv('VITE_APP_ROUTES', 'path');
    const links = Object.values(await load());

    expect(links.every((link) => link.startsWith('/') && !link.startsWith('//'))).toBe(true);
  });
});
