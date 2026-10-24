// Treecord landing: one pinned stage (foundation.md). Three layers move on one scroll-scrubbed timeline:
// the 3D forest (stage3d.ts), the SVG assets, and the headlines with their hand-drawn marks.
// React owns the page skeleton; GSAP owns everything inside the stage once it is mounted.
import { useEffect, useRef } from 'react';
import { BEATS } from './beats';
import { REDUCE } from './env';
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
        Skip the story
      </a>
      <main>
        <section
          ref={stage}
          className="stage"
          id="stage"
          aria-label="Treecord, every tree proven"
          data-motion={REDUCE ? undefined : ''}
        >
          <div ref={host} className="gl" />
          {/* ponytail: beat markup comes from the shared svg-assets generators as trusted HTML strings (no
              user input); port them to JSX components when the assets stop being shared with the preview pages. */}
          {BEATS.map((beat) => (
            <section
              key={beat.id}
              id={beat.id}
              className={`beat ${beat.cls}`}
              dangerouslySetInnerHTML={{ __html: beat.html() }}
            />
          ))}
          <div ref={rail} className="rail" />
        </section>
      </main>
      <footer className="foot" id="end">
        <strong>Treecord</strong>
        <span>Every tree, proven.</span>
      </footer>
    </>
  );
}
