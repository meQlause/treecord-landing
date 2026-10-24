// Treecord landing: one pinned stage (foundation.md). Three layers move on one scroll-scrubbed timeline:
// the 3D forest (stage3d.ts), the SVG assets, and the headlines with their hand-drawn marks.
// React owns the page skeleton; GSAP owns everything inside the stage once it is mounted.
import { useEffect, useRef } from 'react';
import { LandingView } from './landing.view';
import { mountStory } from './story';

const LIFT_MS = 700; // the loader's fade in index.html

/** Fades the loader in index.html out and removes it. A no-op where there is none (tests, a second mount). */
function liftLoader(): void {
  const loader = document.getElementById('loader');
  document.documentElement.classList.remove('loading');
  if (!loader) {
    return;
  }
  loader.classList.add('lifting');
  setTimeout(() => loader.remove(), LIFT_MS);
}

/** Everything the first screen needs: the fonts and the 3D layer's chunk (three.js). A failed chunk still opens the page. */
const ready = (): Promise<unknown> =>
  Promise.all([document.fonts.ready, import('./stage3d').catch(() => undefined)]);

export function Landing() {
  const stage = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let teardown = (): void => {};
    void ready().then(() => {
      if (cancelled || !stage.current || !host.current || !rail.current) {
        return;
      }
      teardown = mountStory({ stage: stage.current, host: host.current, rail: rail.current });
      // two frames: the forest is built and drawn before the loader starts to fade
      requestAnimationFrame(() => requestAnimationFrame(liftLoader));
    });

    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  return <LandingView stage={stage} host={host} rail={rail} />;
}
