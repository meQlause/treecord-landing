// Treecord landing: one pinned stage (foundation.md). Three layers move on one scroll-scrubbed timeline:
// the 3D forest (stage3d.ts), the SVG assets, and the headlines with their hand-drawn marks.
// React owns the page skeleton; GSAP owns everything inside the stage once it is mounted.
import { useEffect, useRef } from 'react';
import { BEATS } from './beats';
import { COPY } from './landing.copy';
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

  return (
    <>
      <a className="skip" href="#end">
        {COPY.shell.skip}
      </a>
      <main>
        <section ref={stage} className="stage" id="stage" aria-label={COPY.shell.label}>
          <div ref={host} className="gl" />
          {BEATS.map((beat) => (
            <section key={beat.id} id={beat.id} className={`beat ${beat.cls}`}>
              <beat.Content />
            </section>
          ))}
          <div ref={rail} className="rail" />
        </section>
      </main>
      <footer className="foot" id="end">
        <strong>{COPY.shell.name}</strong>
        <span>{COPY.shell.footer}</span>
      </footer>
    </>
  );
}
