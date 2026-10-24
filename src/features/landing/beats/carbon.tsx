import { Art } from '../../../shared/art/art';
import { serialSVG, serialTimeline } from '../../../shared/art/serial';
import { pick } from '../../../shared/dom';
import { place } from '../helpers';
import { COPY } from '../landing.copy';
import type { Beat } from '../types';
import { Copy } from '../words/rich';
import { script } from '../words/script';
import { SPLIT } from './timing';

// the coin is the 3D carbon particles; the registry serial is SVG
function CarbonContent() {
  return (
    <>
      <Copy says={COPY.carbon.says} heading="h2" />
      <div className="stage-box" style={{ alignItems: 'flex-end', paddingBottom: '12vh' }}>
        <div className="glass">
          <Art markup={serialSVG()} />
        </div>
      </div>
    </>
  );
}

const TIMING = { coinStart: 0.1, coinTail: 0.3, serialLead: 0.1, serialLength: 0.7 };
const CUES = Object.values({ a: 0, b: 0.45, c: 0.95 });

export const carbon: Beat = {
  id: 'carbon',
  cls: SPLIT,
  enter: 'zoomOut',
  Content: CarbonContent,
  build(timeline, root, rig) {
    const serial = pick<SVGElement>(root, '.tc-serial');
    serial.style.width = 'min(440px, 80vw)';
    const { at: cue } = script(timeline, pick(root, '.copy'), CUES);
    // the coin is formed by "one owner"
    timeline.fromTo(
      rig,
      { carbon: 0 },
      { carbon: 1, duration: cue[1] + TIMING.coinTail, ease: 'power1.inOut' },
      TIMING.coinStart,
    );
    place(timeline, serialTimeline(serial), cue[2] - TIMING.serialLead, TIMING.serialLength);
  },
};
