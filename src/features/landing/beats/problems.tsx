import { Art } from '../../../shared/art/art';
import { blindFundingSVG, blindFundingTimeline } from '../../../shared/art/blind-funding';
import { certificateSVG, certificateTimeline } from '../../../shared/art/certificate';
import { forgottenSVG, forgottenTimeline } from '../../../shared/art/forgotten';
import { pick } from '../../../shared/dom';
import { place } from '../helpers';
import { COPY } from '../landing.copy';
import type { Beat } from '../types';
import { Copy } from '../words/rich';
import { script } from '../words/script';
import { EASE } from './timing';

const PANELS = [forgottenSVG, blindFundingSVG, certificateSVG];

function ProblemsContent() {
  return (
    <div className="strip">
      {COPY.problems.panels.map((says, index) => (
        <div className="panel" key={says[0].big}>
          <Art markup={PANELS[index]()} />
          <Copy says={says} />
        </div>
      ))}
    </div>
  );
}

const TIMING = { slide: 0.8, asset: 0.85, firstCue: 0.05, secondCue: 0.5, minPanel: 0.9 };

export const problems: Beat = {
  id: 'problems',
  cls: 'beat--strip',
  enter: 'panRight',
  Content: ProblemsContent,
  build(timeline, root, rig, motion) {
    const wilt = pick<SVGElement>(root, '.tc-forgotten');
    const blind = pick<SVGElement>(root, '.tc-blind');
    const cert = pick<SVGElement>(root, '.tc-certificate');
    wilt.style.height = '40vh';
    blind.style.height = '30vh';
    cert.style.height = '36vh';
    const strip = pick(root, '.strip');
    const copies = root.querySelectorAll('.copy');
    const assets = [
      forgottenTimeline(wilt),
      blindFundingTimeline(blind),
      certificateTimeline(cert),
    ];
    // each panel plays its asset and both headlines; the strip only slides on once they have been read
    let clock = 0;
    assets.forEach((asset, index) => {
      if (index) {
        timeline.to(
          strip,
          { x: () => (motion ? -index * innerWidth : 0), duration: TIMING.slide, ease: EASE.power },
          clock,
        );
        clock += TIMING.slide;
      }
      place(timeline, asset, clock, TIMING.asset);
      const cues = [clock + TIMING.firstCue, clock + TIMING.secondCue];
      clock = Math.max(script(timeline, copies[index], cues).end, clock + TIMING.minPanel);
    });
    timeline.to(rig, { px: 16, lx: 16, duration: clock }, 0); // the forest drifts behind the strip: parallax
  },
};
