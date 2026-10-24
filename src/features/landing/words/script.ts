// The words engine: story headlines split into masked words that rise at their cue, with their marks
// drawing right after. All of it is timeline pieces, so the master timeline can scrub them.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { pick } from '../../../shared/dom';
import type { Timeline } from '../../../shared/art/timeline';
import { drawFx } from './marks';

/** Reading time a headline gets after its last mark has drawn (timeline units; 1 unit ≈ one screen of scroll). */
export const HOLD = 0.4;
const REVEAL = 0.17; // words rising before the marks start
const EXIT = { length: 0.07, lift: -28 };
const RISE = { yPercent: 120, opacity: 0, rotate: 4, ease: 'power4.out' };
const HEADING = /^H[1-6]$/;
const GREET = { delay: 0.15, slow: 0.25, overlap: '-=0.35' };

export interface Prepared {
  words: Element[];
  fx: Timeline;
}

/** Split one say into masked words and draw its marks. Words of a swapped-in phrase wait for their mark. */
export function prepare(say: Element): Prepared {
  // linesClass "ln" gives the masks class "ln-mask"; the page pads that mask so descenders (g, y) are not clipped
  const line = pick(say, '.big');
  const split = SplitText.create(line, {
    type: 'words, lines',
    mask: 'lines',
    wordsClass: 'w',
    linesClass: 'ln',
    // SplitText labels the line with its original text and hides the pieces; an aria-label is only allowed on
    // a heading, so a plain paragraph keeps its split words readable instead
    aria: HEADING.test(line.tagName) ? 'auto' : 'none',
  });

  return { words: split.words.filter((word) => !word.closest('.fx--new')), fx: drawFx(say) };
}

export interface Cue {
  /** When the headline starts, or null if it is already on screen. */
  at: number | null;
  /** When it leaves, or null if it stays. */
  until: number | null;
}

/** One headline: words rise out of their line masks at `cue.at`, its marks draw right after, it leaves at `cue.until`. */
export function speak(
  master: Timeline,
  say: Element,
  cue: Cue,
  prepared: Prepared | null = cue.at !== null ? prepare(say) : null,
): void {
  if (prepared && cue.at !== null) {
    // opacity too, not only the mask: raised step numbers ({num:}) sit partly outside their line mask
    master.from(prepared.words, { ...RISE, duration: 0.14, stagger: { amount: 0.06 } }, cue.at);
    master.add(prepared.fx.paused(false), cue.at + REVEAL);
  }
  if (cue.until !== null) {
    master.to(
      say,
      { autoAlpha: 0, y: EXIT.lift, duration: EXIT.length, ease: 'power2.in' },
      cue.until - EXIT.length,
    );
  }
}

/** The start of every say, and the time the last one is done (its marks drawn and HOLD on screen). */
function schedule(times: (number | null)[], prepared: (Prepared | null)[]) {
  const starts: (number | null)[] = [];
  let ready = 0;
  prepared.forEach((entry, index) => {
    const wanted = times[index];
    if (wanted === null || !entry) {
      starts.push(null);
      ready = HOLD;

      return;
    }
    const start = Math.max(wanted, ready);
    starts.push(start);
    ready = start + REVEAL + entry.fx.duration() + HOLD;
  });

  return { at: starts, ready };
}

/**
 * Speak each .say of a .copy. times[i] is the earliest a say may start; it starts later if the previous
 * one has not finished drawing its marks and been on screen for HOLD (so a {swap:} is never cut off).
 * Each say leaves when the next arrives. An extra trailing time (times[says.length]) makes the last say
 * leave too. A null time means "already shown" (the greeting on load).
 * Returns { at, end }: the actual start times, and when the copy is done (last exit, or last say read).
 */
export function script(
  master: Timeline,
  copy: Element,
  times: number[],
): { at: number[]; end: number };
export function script(
  master: Timeline,
  copy: Element,
  times: (number | null)[],
): { at: (number | null)[]; end: number };
export function script(
  master: Timeline,
  copy: Element,
  times: (number | null)[],
): { at: (number | null)[]; end: number } {
  const says = [...copy.querySelectorAll('.say')];
  const prepared = says.map((say, index) => (times[index] === null ? null : prepare(say)));
  const { at: starts, ready } = schedule(times, prepared);
  const exit = times.length > says.length ? Math.max(times[says.length] ?? 0, ready) : null;
  says.forEach((say, index) => {
    const until = index + 1 < says.length ? starts[index + 1] : exit;
    speak(master, say, { at: starts[index], until }, prepared[index]);
  });
  const end = exit ?? ready;
  if (exit === null) {
    master.set({}, {}, end); // the last line rests on screen before the beat moves on
  }

  return { at: starts, end };
}

/** The first headline of a page greets on load (not on scroll): words rise, then its marks draw. */
export function greet(say: Element): Timeline {
  const { words, fx } = prepare(say);

  return gsap
    .timeline({ delay: GREET.delay })
    .from(words, { ...RISE, stagger: 0.07, duration: 0.9 })
    .add(fx.paused(false).timeScale(GREET.slow), GREET.overlap);
}
