import { pick } from '../../../shared/dom';
import { COPY } from '../landing.copy';
import type { Beat } from '../types';
import { Copy } from '../words/rich';
import { script } from '../words/script';
import { EASE, SPLIT } from './timing';

// the seedling itself is the 3D hero tree
function SeedlingContent() {
  return (
    <>
      <Copy says={COPY.seedling.says} heading="h2" />
      <div />
    </>
  );
}

const CUES = Object.values({ first: 0, second: 0.6 });

export const seedling: Beat = {
  id: 'seedling',
  cls: SPLIT,
  enter: 'zoomIn',
  Content: SeedlingContent,
  build(timeline, root, rig) {
    script(timeline, pick(root, '.copy'), CUES);
    timeline.to(rig, { pz: 3.8, py: 2.2, duration: timeline.duration(), ease: EASE.sine }, 0);
  },
};
