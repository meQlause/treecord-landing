// Assembles the story: every beat's inner timeline, one master timeline of beat / camera move / beat,
// and the scroll trigger that pins the stage and scrubs it.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { SplitText } from 'gsap/SplitText';
import { greet } from '../../../../svg-assets/src/words.js';
import { BEATS } from './beats';
import { ENTER, MOVE, POSES } from './camera';
import { MOBILE, REDUCE } from '../../shared/motion/env';
import { pick } from './helpers';
import { createStage3D } from './stage3d';
import type { Beat, Rig, Timeline } from './types';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin);

interface Built extends Beat {
  root: HTMLElement;
  timeline: Timeline;
}

export interface StageParts {
  stage: HTMLElement;
  host: HTMLElement;
  rail: HTMLElement;
}

const SCROLL_PER_UNIT = { mobile: 0.95, desktop: 1.15 }; // slow enough to read
const GROW = { length: 3.2, delay: 0.1 };
const SCRUB = 0.7;
const RELOAD = { width: 40, wait: 300 };

/** Inner timelines for every beat, built before any beat is moved or scaled so measurements are true. */
function buildBeats(stage: HTMLElement, rig: Rig): Built[] {
  return BEATS.map((beat) => {
    const root = pick(stage, `#${beat.id}`);
    const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    beat.build(timeline, root, rig, !REDUCE);

    return { ...beat, root, timeline };
  });
}

function buildMaster(beats: Built[], rig: Rig, rail: HTMLElement): Timeline {
  const master = gsap.timeline({ defaults: { ease: 'none' } });
  beats.forEach((beat, index) => {
    if (beat.enter) {
      const start = master.duration();
      ENTER[beat.enter](master, beats[index - 1].root, beat.root, start);
      master.to(rig, { ...POSES[beat.id], duration: MOVE, ease: 'power2.inOut' }, start);
    }
    master.addLabel(beat.id).add(beat.timeline.paused(false));
  });

  return master.fromTo(rail, { scaleX: 0 }, { scaleX: 1, duration: master.duration() }, 0);
}

/** ?at=survival,0.5 jumps to a beat at a progress within it (review and screenshots). */
function jumpTo(target: string, beats: Built[], master: Timeline, trigger: ScrollTrigger): void {
  const [id, progress] = target.split(',');
  const beat = beats.find((candidate) => candidate.id === id);
  if (!beat) {
    return;
  }
  const time = master.labels[id] + beat.timeline.duration() * Number(progress);
  window.scrollTo(0, trigger.start + (trigger.end - trigger.start) * (time / master.duration()));
}

function playMotion(parts: StageParts, beats: Built[], rig: Rig, hello: Timeline | null): void {
  gsap.from(rig, { grow: 0, duration: GROW.length, ease: 'power2.out', delay: GROW.delay });
  gsap.set(beats[0].root, { autoAlpha: 1 });
  const master = buildMaster(beats, rig, parts.rail);
  const perUnit = MOBILE ? SCROLL_PER_UNIT.mobile : SCROLL_PER_UNIT.desktop;
  const trigger = ScrollTrigger.create({
    animation: master,
    trigger: parts.stage,
    start: 'top top',
    end: () => `+=${innerHeight * master.duration() * perUnit}`,
    pin: true,
    scrub: SCRUB,
    invalidateOnRefresh: true,
  });
  ScrollTrigger.refresh();
  hello?.play();
  const target = new URLSearchParams(location.search).get('at');
  if (target) {
    jumpTo(target, beats, master, trigger);
  }
}

/** Reduced motion: no pin, no scrub. Every beat shows its final state as a plain article, every headline
 * visible, marks drawn. The 3D layer is a still backdrop. */
function settle(stage: HTMLElement, beats: Built[], rig: Rig, render: () => void): void {
  beats.forEach((beat) => beat.timeline.progress(1));
  gsap.set(stage.querySelectorAll('.say, .strip, .beat'), {
    clearProps: 'opacity,visibility,transform',
  });
  Object.assign(rig, POSES.roles, { heroGrowth: 1, dim: 0.65 });
  render();
}

// ponytail: word marks and line masks are measured once, so a real width change reloads the page.
// Upgrade path: re-measure through SplitText autoSplit.
function reloadOnResize(): () => void {
  const lastWidth = innerWidth;
  let timer: ReturnType<typeof setTimeout>;
  const onResize = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (Math.abs(innerWidth - lastWidth) > RELOAD.width) {
        location.reload();
      }
    }, RELOAD.wait);
  };
  addEventListener('resize', onResize);

  return () => {
    clearTimeout(timer);
    removeEventListener('resize', onResize);
  };
}

/** Builds the whole story on a mounted stage and returns what undoes it. */
export function mountStory(parts: StageParts): () => void {
  const stage3d = createStage3D(parts.host, { mobile: MOBILE, still: REDUCE });
  const { rig } = stage3d;
  Object.assign(rig, POSES.hero);
  // the hook greets on load, before any scroll; the forest grows around the seedling at the same time
  const hello = REDUCE ? null : greet(pick(parts.stage, '.hook .say'));
  const context = gsap.context(() => {
    const beats = buildBeats(parts.stage, rig);
    if (REDUCE) {
      settle(parts.stage, beats, rig, stage3d.render);
    } else {
      playMotion(parts, beats, rig, hello);
    }
  }, parts.stage);
  const stopResize = reloadOnResize();

  return () => {
    stopResize();
    context.revert();
    stage3d.dispose();
  };
}
