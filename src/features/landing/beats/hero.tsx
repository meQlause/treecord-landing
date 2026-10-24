import { Art } from '../../../shared/art/art';
import { logoSVG, logoTimeline } from '../../../shared/art/logo';
import { pick } from '../../../shared/dom';
import { place } from '../helpers';
import { COPY } from '../landing.copy';
import type { Beat } from '../types';
import { Copy } from '../words/rich';
import { script } from '../words/script';
import { EASE } from './timing';

function HeroContent() {
  return (
    <>
      <Copy says={COPY.hero.hook} className="hook" heading="h1" />
      <div className="brand">
        <div className="mark">
          <Art markup={logoSVG()} />
          <span className="wordmark">{COPY.shell.name}</span>
        </div>
        <Copy says={[COPY.hero.tagline]} className="tagline" />
      </div>
    </>
  );
}

const TIMING = { logoLead: 0.05, logoLength: 0.8, wordmark: 0.3, tagline: 0.55 };
const HOOK_CUES = Object.values({ greeted: null, second: 0.5, third: 1 });

export const hero: Beat = {
  id: 'hero',
  cls: 'beat--hero',
  enter: null,
  Content: HeroContent,
  build(timeline, root, rig) {
    const logo = pick<SVGElement>(root, '.tc-logo');
    logo.style.width = 'clamp(72px, 11vw, 150px)';
    // script() returns when the hook has really been read; the mark assembles only then
    const { end } = script(timeline, pick(root, '.hook'), HOOK_CUES);
    place(timeline, logoTimeline(logo), end - TIMING.logoLead, TIMING.logoLength);
    timeline.from(
      pick(root, '.wordmark'),
      { autoAlpha: 0, x: -24, duration: 0.25, ease: 'power3.out' },
      end + TIMING.wordmark,
    );
    script(timeline, pick(root, '.tagline'), [end + TIMING.tagline]);
    timeline.to(rig, { pz: 21, py: 4.8, duration: timeline.duration(), ease: EASE.sine }, 0);
  },
};
