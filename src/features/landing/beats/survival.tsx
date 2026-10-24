import { Art } from '../../../shared/art/art';
import { milestonesSVG, milestonesTimeline } from '../../../shared/art/milestones';
import { pick } from '../../../shared/dom';
import { place } from '../helpers';
import { COPY } from '../landing.copy';
import type { Beat } from '../types';
import { Copy } from '../words/rich';
import { script } from '../words/script';
import { EASE } from './timing';

// the tree that grows is the 3D hero tree; the track and payouts are SVG
function SurvivalContent() {
  return (
    <>
      <Copy says={COPY.survival.says} />
      <div />
      <div className="glass" style={{ justifySelf: 'center', width: 'min(1100px,100%)' }}>
        <Art markup={milestonesSVG()} />
      </div>
    </>
  );
}

const TIMING = { start: 0.2, lastLead: 0.1 };
const CUES = Object.values({ a: 0, b: 0.65, c: 1.2, d: 1.75 });

export const survival: Beat = {
  id: 'survival',
  cls: 'beat--stack beat--left',
  enter: 'panLeft',
  Content: SurvivalContent,
  build(timeline, root, rig) {
    const track = pick<SVGElement>(root, '.tc-milestones');
    track.style.width = '100%';
    const { at: cue } = script(timeline, pick(root, '.copy'), CUES);
    // months 0..36 and the tree share one progress, timed so month 36 pays out as "40% waits for month 36" lands
    const months = cue[3] + TIMING.lastLead;
    place(timeline, milestonesTimeline(track), TIMING.start, months);
    timeline.fromTo(
      rig,
      { heroGrowth: 0 },
      { heroGrowth: 1, duration: months, ease: 'none' },
      TIMING.start,
    );
    timeline.to(rig, { px: 5, pz: 14.5, duration: timeline.duration(), ease: EASE.sine }, 0);
  },
};
