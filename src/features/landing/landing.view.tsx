// The landing's markup and nothing else: the skip link, the stage with its 3D host, the beats and the rail,
// and the footer. Pure, so it also renders in plain Node: the build prerenders it, and the page reads as an
// article without JavaScript. The pinned layout (data-motion) is added by the client once the story mounts.
import type { RefObject } from 'react';
import { BEATS } from './beats';
import { COPY } from './landing.copy';

export interface ViewRefs {
  stage?: RefObject<HTMLElement | null>;
  host?: RefObject<HTMLDivElement | null>;
  rail?: RefObject<HTMLDivElement | null>;
}

export function LandingView({ stage, host, rail }: ViewRefs) {
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
      <footer className="foot" id="end" tabIndex={-1}>
        <strong>{COPY.shell.name}</strong>
        <span>{COPY.shell.footer}</span>
      </footer>
    </>
  );
}
