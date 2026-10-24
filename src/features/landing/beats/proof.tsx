import { Art } from '../../../shared/art/art';
import { fieldCheckSVG, fieldCheckTimeline } from '../../../shared/art/field-check';
import { PHONE_SCREEN_VIEWBOX, phoneSVG, phoneTimeline } from '../../../shared/art/phone';
import { shieldSVG, shieldTimeline } from '../../../shared/art/shield';
import { pick } from '../../../shared/dom';
import { place } from '../helpers';
import { COPY } from '../landing.copy';
import type { Beat } from '../types';
import { Copy } from '../words/rich';
import { script } from '../words/script';
import { EASE, SPLIT } from './timing';

function ProofContent() {
  return (
    <>
      <Copy says={COPY.proof.says} />
      <div className="stage-box">
        <Art markup={phoneSVG()} />
        <div style={{ display: 'grid', gap: '12px', justifyItems: 'center' }}>
          <Art markup={fieldCheckSVG()} />
          <Art markup={shieldSVG()} />
        </div>
      </div>
    </>
  );
}

const TIMING = { field: 0.2, viewbox: 0.35, shield: 0.35, shieldLead: 0.1 };
const CUES = Object.values({ a: 0, b: 0.4, c: 0.75, d: 1.1 });

export const proof: Beat = {
  id: 'proof',
  cls: SPLIT,
  enter: 'zoomIn',
  Content: ProofContent,
  build(timeline, root, rig) {
    const phone = pick<SVGElement>(root, '.tc-phone');
    Object.assign(phone.style, { height: '70vh', aspectRatio: '320 / 600' });
    const field = pick<SVGElement>(root, '.tc-field');
    field.style.width = 'clamp(170px, 24vw, 330px)';
    const shield = pick<SVGElement>(root, '.tc-shield');
    shield.style.width = 'clamp(52px, 6vw, 90px)';
    const { at: cue, end } = script(timeline, pick(root, '.copy'), CUES);
    // the phone records through the first lines, the values lock with "GPS and time", the seal lands with "Rejected"
    place(timeline, phoneTimeline(phone), 0, cue[3]);
    timeline.to(
      phone,
      { attr: { viewBox: PHONE_SCREEN_VIEWBOX }, duration: TIMING.viewbox, ease: EASE.power },
      cue[1],
    );
    place(timeline, fieldCheckTimeline(field), TIMING.field, cue[2] + TIMING.field);
    place(timeline, shieldTimeline(shield), cue[3] + TIMING.shieldLead, TIMING.shield);
    timeline.to(rig, { pz: 21, duration: end }, 0);
  },
};
