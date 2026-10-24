import { Art } from '../../../shared/art/art';
import { pipelineSVG, pipelineTimeline } from '../../../shared/art/pipeline';
import { pick } from '../../../shared/dom';
import { place } from '../helpers';
import { COPY } from '../landing.copy';
import type { Beat } from '../types';
import { Copy } from '../words/rich';
import { script } from '../words/script';

// no glass: a 2D beat, the paper backdrop is calm enough
function PipelineContent() {
  return (
    <>
      <Copy says={COPY.pipeline.says} />
      <div className="stage-box">
        <Art markup={pipelineSVG()} />
      </div>
    </>
  );
}

const TIMING = { start: 0.55, length: 2.4 };
const STEPS = Object.values({ a: 0.16, b: 0.79, c: 1.41, d: 2.04 });

export const pipeline: Beat = {
  id: 'pipeline',
  cls: 'beat--stack',
  enter: 'panRight',
  Content: PipelineContent,
  build(timeline, root, rig, motion) {
    const svg = pick<SVGElement>(root, '.tc-pipeline');
    // height-bound so the panel always fits its row on short screens (landscape tablets) and never rides up over the words
    // overflow visible: the path is not cropped at the box, it runs on to both screen edges while the camera pans
    if (motion) {
      Object.assign(svg.style, {
        height: 'min(40vh, 38vw)',
        aspectRatio: '800 / 360',
        maxWidth: '100%',
        overflow: 'visible',
      });
    } else {
      svg.style.width = '100%';
    }
    // the proof sets off once "Proof in. Payment out." has been read; each caption lands just before its node lights
    place(timeline, pipelineTimeline(svg), TIMING.start, TIMING.length);
    if (motion) {
      timeline.fromTo(
        svg,
        { attr: { viewBox: '0 0 800 360' } },
        { attr: { viewBox: '800 0 800 360' }, duration: TIMING.length },
        TIMING.start,
      );
    }
    script(timeline, pick(root, '.copy'), [0, ...STEPS.map((step) => TIMING.start + step)]);
    timeline.to(rig, { px: 30, lx: 30, duration: timeline.duration() }, 0);
  },
};
