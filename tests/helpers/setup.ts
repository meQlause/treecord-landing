import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has neither matchMedia nor document.fonts; the landing reads both when it mounts.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
Object.defineProperty(document, 'fonts', {
  value: { ready: Promise.resolve() },
  configurable: true,
});

afterEach(cleanup);
