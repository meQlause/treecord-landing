// Treecord landing: one pinned stage (foundation.md). Three layers move on one scroll-scrubbed timeline:
// the 3D forest (stage3d.ts), the SVG assets, and the headlines with their hand-drawn marks.
// React owns the page skeleton; GSAP owns everything inside the stage once it is mounted.
import { useEffect, useRef } from 'react';
import { LandingView } from './landing.view';
import { mountStory } from './story';

export function Landing() {
  const stage = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let teardown = (): void => {};
    void document.fonts.ready.then(() => {
      if (cancelled || !stage.current || !host.current || !rail.current) {
        return;
      }
      teardown = mountStory({ stage: stage.current, host: host.current, rail: rail.current });
    });

    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  return <LandingView stage={stage} host={host} rail={rail} />;
}
