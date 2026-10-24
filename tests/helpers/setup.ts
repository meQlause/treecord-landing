import { cleanup } from '@testing-library/react';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { afterEach, vi } from 'vitest';

// jsdom has neither matchMedia nor document.fonts; the landing reads both when it mounts.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
// nor the two observers the call to action uses to fit its outline and to run only while on screen
class InertObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', InertObserver);
vi.stubGlobal('IntersectionObserver', InertObserver);
Object.defineProperty(document, 'fonts', {
  value: { ready: Promise.resolve(), addEventListener: vi.fn(), removeEventListener: vi.fn() },
  configurable: true,
});

// the same plugins the story registers, so the art's timelines are built as they are on the page
gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin);

afterEach(cleanup);
