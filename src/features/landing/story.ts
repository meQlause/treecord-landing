// Assembles the story: every beat's inner timeline, one master timeline of beat / camera move / beat,
// and the scroll trigger that pins the stage and scrubs it.
//
// Two lifetimes. The WebGL stage lives for the whole visit. The story (split words, drawn marks, timelines,
// the pin) is built by buildStory(), which returns what undoes it, so a resize or a change of the visitor's
// motion setting rebuilds it in place: no page reload.
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { pick } from '../../shared/dom';
import { MOBILE, prefersReducedMotion, watchReducedMotion } from '../../shared/motion/env';
import { BEATS } from './beats';
import { ENTER, MOVE, POSES } from './camera';
import { createStage3D, type Stage3D } from './stage3d';
import type { Beat, Rig, Timeline } from './types';
import { greet } from './words/script';

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
const RESIZE = { width: 40, wait: 300 };

/** Inner timelines for every beat, built before any beat is moved or scaled so measurements are true. */
function buildBeats(stage: HTMLElement, rig: Rig, motion: boolean): Built[] {
  return BEATS.map((beat) => {
    const root = pick(stage, `#${beat.id}`);
    const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    beat.build(timeline, root, rig, motion);

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

/** ?at=survival,0.5 jumps to a beat at a progress within it (review and screenshots), in development only. */
function reviewTarget(): string | null {
  return import.meta.env.DEV ? new URLSearchParams(location.search).get('at') : null;
}

function jumpTo(target: string, beats: Built[], master: Timeline, trigger: ScrollTrigger): void {
  const [id, progress] = target.split(',');
  const beat = beats.find((candidate) => candidate.id === id);
  if (!beat) {
    return;
  }
  const time = master.labels[id] + beat.timeline.duration() * Number(progress);
  window.scrollTo(0, trigger.start + (trigger.end - trigger.start) * (time / master.duration()));
}

interface Run {
  parts: StageParts;
  rig: Rig;
  /** First build of a visit: the forest grows in and the hook greets. A rebuild shows both settled. */
  intro: boolean;
}

function playMotion({ parts, rig, intro }: Run, beats: Built[], hello: Timeline): void {
  const target = reviewTarget();
  // a review jump shows the beat settled, so it skips the forest's growth on load
  if (intro && !target) {
    gsap.from(rig, { grow: 0, duration: GROW.length, ease: 'power2.out', delay: GROW.delay });
  }
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
  if (intro) {
    hello.play();
  } else {
    hello.progress(1);
  }
  if (target) {
    jumpTo(target, beats, master, trigger);
  }
}

/** Reduced motion: no pin, no scrub. Every beat shows its final state as a plain article, every headline
 * visible, marks drawn. The 3D layer is a still backdrop. */
function settle({ parts, rig }: Run, beats: Built[], render: () => void): void {
  beats.forEach((beat) => beat.timeline.progress(1));
  gsap.set(parts.stage.querySelectorAll('.say, .strip, .beat'), {
    clearProps: 'opacity,visibility,transform',
  });
  Object.assign(rig, POSES.roles, { heroGrowth: 1, dim: 0.65 });
  render();
}

/** Builds the story on the mounted stage and returns what undoes it. */
function buildStory(run: Run, stage3d: Stage3D, reduce: boolean): () => void {
  const { parts, rig } = run;
  if (reduce) {
    delete parts.stage.dataset.motion;
  } else {
    parts.stage.dataset.motion = ''; // the pinned layout; without it (no script, reduced motion) the page is an article
  }
  Object.assign(rig, POSES.hero);
  const context = gsap.context(() => {
    // the hook greets on load, before any scroll; the forest grows around the seedling at the same time
    const hello = greet(pick(parts.stage, '.hook .say'));
    const beats = buildBeats(parts.stage, rig, !reduce);
    if (reduce) {
      hello.progress(1);
      settle(run, beats, stage3d.render);
    } else {
      playMotion(run, beats, hello);
    }
  }, parts.stage);

  return () => {
    context.revert();
    parts.stage.querySelectorAll('.fx-layer').forEach((layer) => layer.remove()); // the marks' overlay layers
  };
}

interface Session {
  reduce: boolean;
  stage3d: Stage3D;
  undo: () => void;
  width: number;
}

function begin(parts: StageParts, reduce: boolean): Session {
  const stage3d = createStage3D(parts.host, { mobile: MOBILE, still: reduce });
  const undo = buildStory({ parts, rig: stage3d.rig, intro: true }, stage3d, reduce);

  return { reduce, stage3d, undo, width: innerWidth };
}

function end(session: Session): void {
  session.undo();
  session.stage3d.dispose();
}

const scrollRange = (): number => Math.max(document.documentElement.scrollHeight - innerHeight, 1);

/**
 * A real width change: lines wrap differently, so words and marks are measured again. Taking the pin away and
 * putting it back makes the browser clamp the scroll position, so the visitor's place in the page is kept.
 */
function rebuild(parts: StageParts, session: Session): void {
  const place = scrollY / scrollRange();
  session.undo();
  session.undo = buildStory(
    { parts, rig: session.stage3d.rig, intro: false },
    session.stage3d,
    session.reduce,
  );
  session.width = innerWidth;
  scrollTo(0, place * scrollRange());
}

function watchResize(onResize: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const listener = (): void => {
    clearTimeout(timer);
    timer = setTimeout(onResize, RESIZE.wait);
  };
  addEventListener('resize', listener);

  return () => {
    clearTimeout(timer);
    removeEventListener('resize', listener);
  };
}

/** Builds the whole story on a mounted stage and returns what undoes it. */
export function mountStory(parts: StageParts): () => void {
  let session = begin(parts, prefersReducedMotion());
  const stopResize = watchResize(() => {
    if (Math.abs(innerWidth - session.width) > RESIZE.width) {
      rebuild(parts, session);
    }
  });
  const stopMotion = watchReducedMotion((reduce) => {
    end(session);
    session = begin(parts, reduce);
  });

  return () => {
    stopResize();
    stopMotion();
    end(session);
  };
}
