import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  HOLD,
  greet,
  prepare,
  script,
  speak,
} from '../../../../../src/features/landing/words/script';
import { stubLayout } from '../../../../helpers/layout';
import { mount } from '../../../../helpers/timelines';

const REVEAL = 0.17; // words rising before the marks start
const EXIT = 0.07; // how long a headline takes to leave
// With the stubbed layout the marks of these headlines take: a highlighter 0.12, a loop 0.16, a strike plus a
// swapped-in word 0.36.
const MARK_TIME = 0.12;
const LOOP_TIME = 0.16;

const SAYS = [
  '<div class="say"><p class="big">Anyone can <span class="fx" data-fx="mark">plant</span> a tree.</p></div>',
  '<div class="say"><p class="big">Keeping it <span class="fx" data-fx="circle">alive</span> is hard.</p></div>',
  '<div class="say"><p class="big">We pay for <span class="fx" data-fx="strike">planting</span> <span class="fx fx--new" data-fx="new"><span>staying alive.</span></span></p></div>',
];
const copy = (count = SAYS.length): HTMLElement =>
  mount(`<div class="copy">${SAYS.slice(0, count).join('')}</div>`);
const master = () => gsap.timeline({ paused: true });
const near = (value: number, wanted: number): boolean => Math.abs(value - wanted) < 1e-6;
const startsOf = (timeline: ReturnType<typeof master>) =>
  timeline.getChildren(false, true, true).map((child) => child.startTime());

let restore = (): void => {};

beforeAll(() => {
  gsap.registerPlugin(SplitText);
});

beforeEach(() => {
  restore = stubLayout();
});

afterEach(() => restore());

describe('prepare', () => {
  it('splits a headline into words inside masked lines, so they can rise out of them', () => {
    const say = mount(SAYS[0]);

    const { words } = prepare(say);

    expect(words.map((word) => word.textContent)).toEqual(['Anyone', 'can', 'plant', 'a', 'tree.']);
    expect(say.querySelectorAll('.ln-mask').length).toBeGreaterThan(0);
    expect(say.querySelectorAll('.ln').length).toBeGreaterThan(0);
    expect(words.every((word) => word.classList.contains('w'))).toBe(true);
  });

  it('draws the headline marks too: a paused timeline and the two overlay layers', () => {
    const say = mount(SAYS[0]);

    const { fx: drawing } = prepare(say);

    expect(drawing.paused()).toBe(true);
    expect(say.querySelectorAll('.fx-layer')).toHaveLength(2);
    expect(drawing.duration()).toBeCloseTo(MARK_TIME);
  });

  it('leaves the words of a swapped-in phrase out: they wait for their mark', () => {
    const say = mount(SAYS[2]);

    const { words } = prepare(say);

    expect(words.some((word) => word.closest('.fx--new'))).toBe(false);
    expect(say.querySelector('.fx--new .w')).not.toBeNull();
  });
});

describe('script', () => {
  it('skips a headline whose time is null (already on screen) and holds the next one for HOLD', () => {
    const { at } = script(master(), copy(), [null, 0.1, 5]);

    expect(at[0]).toBeNull();
    expect(at[1]).toBeCloseTo(HOLD); // the greeting counts as read at HOLD, which is later than 0.1
  });

  it('starts a headline at its own time when that is later than the previous one needs', () => {
    const { at } = script(master(), copy(), [null, 0.5, 5]);

    expect(at[1]).toBeCloseTo(0.5);
    expect(at[2]).toBe(5);
  });

  it('delays a headline until the one before has drawn its marks and been on screen for HOLD', () => {
    const { at } = script(master(), copy(2), [0, 0.1]);

    expect(at[0]).toBe(0);
    expect(at[1]).toBeCloseTo(REVEAL + MARK_TIME + HOLD);
  });

  it('never starts a headline sooner than REVEAL + HOLD after the one before it', () => {
    const { at } = script(master(), copy(), [0, 0, 0]);

    expect((at[1] ?? 0) - (at[0] ?? 0)).toBeGreaterThanOrEqual(REVEAL + HOLD);
    expect((at[2] ?? 0) - (at[1] ?? 0)).toBeGreaterThanOrEqual(REVEAL + HOLD);
  });

  it('raises the words of each headline at its start and draws its marks REVEAL later', () => {
    const timeline = master();

    const { at } = script(timeline, copy(2), [0, 0.3]);

    const starts = startsOf(timeline);
    for (const start of at) {
      expect(starts.some((time) => near(time, start ?? 0))).toBe(true);
      expect(starts.some((time) => near(time, (start ?? 0) + REVEAL))).toBe(true);
    }
  });

  it('makes each headline leave EXIT before the next one arrives', () => {
    const timeline = master();
    const block = copy(2);

    const { at } = script(timeline, block, [0, 0.3]);

    const leaving = timeline
      .getChildren(false, true, false)
      .filter((tween) => 'autoAlpha' in tween.vars);
    expect(leaving).toHaveLength(1);
    expect(leaving[0].startTime()).toBeCloseTo((at[1] ?? 0) - EXIT);
    expect(leaving[0].targets()[0]).toBe(block.querySelector('.say'));
  });

  it('ends where the last headline has been read when there is no trailing time, and rests there', () => {
    const timeline = master();

    const { at, end } = script(timeline, copy(2), [0, 0.3]);

    expect(end).toBeCloseTo((at[1] ?? 0) + REVEAL + LOOP_TIME + HOLD);
    expect(timeline.duration()).toBeCloseTo(end); // a marker holds the line on screen until then
  });

  it('ends at a trailing time when it is later, and makes the last headline leave then', () => {
    const timeline = master();

    const { end } = script(timeline, copy(2), [0, 0.3, 9]);

    expect(end).toBeCloseTo(9);
    expect(startsOf(timeline).some((time) => near(time, 9 - EXIT))).toBe(true);
    expect(timeline.duration()).toBeCloseTo(9);
  });

  it('waits for the last headline to be read when the trailing time is too early', () => {
    const timeline = master();

    const { at, end } = script(timeline, copy(2), [0, 0.3, 0.5]);

    expect(end).toBeCloseTo((at[1] ?? 0) + REVEAL + LOOP_TIME + HOLD);
    expect(end).toBeGreaterThan(0.5);
  });

  it('works for a lone headline', () => {
    const { at, end } = script(master(), copy(1), [2]);

    expect(at).toEqual([2]);
    expect(end).toBeCloseTo(2 + REVEAL + MARK_TIME + HOLD);
  });
});

describe('speak', () => {
  it('adds nothing for a headline that is already on screen and stays', () => {
    const timeline = master();

    speak(timeline, mount(SAYS[0]), { at: null, until: null }, null);

    expect(timeline.getChildren()).toHaveLength(0);
  });

  it('makes a headline that is already on screen leave EXIT before `until`', () => {
    const timeline = master();

    speak(timeline, mount(SAYS[0]), { at: null, until: 3 }, null);

    const [leave] = timeline.getChildren();
    expect(timeline.getChildren()).toHaveLength(1);
    expect(leave.startTime()).toBeCloseTo(3 - EXIT);
    expect(leave.vars).toMatchObject({ autoAlpha: 0, y: -28 });
  });

  it('raises the words at `at`, draws the marks REVEAL later and leaves EXIT before `until`', () => {
    const timeline = master();

    speak(timeline, mount(SAYS[0]), { at: 1, until: 3 });

    const starts = startsOf(timeline).sort((first, second) => first - second);
    expect(starts).toHaveLength(3);
    expect(starts[0]).toBeCloseTo(1);
    expect(starts[1]).toBeCloseTo(1 + REVEAL);
    expect(starts[2]).toBeCloseTo(3 - EXIT);
    const rise = timeline.getChildren(false, true, false).find((tween) => 'yPercent' in tween.vars);
    expect(rise?.vars).toMatchObject({ yPercent: 120, opacity: 0 });
  });

  it('keeps the headline on screen when it never leaves', () => {
    const timeline = master();

    speak(timeline, mount(SAYS[0]), { at: 1, until: null });

    expect(startsOf(timeline)).toHaveLength(2); // the rise and the marks, no exit
  });
});

describe('greet', () => {
  it('raises the first headline on load, after a short delay, a word at a time', () => {
    const say = mount(SAYS[1]);

    const timeline = greet(say);

    expect(timeline.delay()).toBeCloseTo(0.15);
    const rise = timeline.getChildren(false, true, false)[0];
    expect(rise.vars).toMatchObject({ yPercent: 120, stagger: 0.07, duration: 0.9 });
    expect(rise.targets().length).toBeGreaterThan(0);
    expect((rise.targets()[0] as HTMLElement).style.opacity).toBe('0'); // hidden until it rises
  });

  it('draws its marks slowly, a quarter speed, overlapping the end of the rise', () => {
    const timeline = greet(mount(SAYS[1]));

    const [drawing] = timeline.getChildren(false, false, true);
    expect(drawing.timeScale()).toBeCloseTo(0.25);
    expect(drawing.paused()).toBe(false);
    expect(drawing.startTime()).toBeLessThan(timeline.getChildren(false, true, false)[0].endTime());
  });
});

describe('prepare and assistive technology', () => {
  const split = (tag: 'p' | 'h2') => {
    const say = document.createElement('div');
    say.innerHTML = `<div class="say"><${tag} class="big">Keeping it alive is the hard part.</${tag}></div>`;
    prepare(say.firstElementChild as Element);

    return say.querySelector('.big') as HTMLElement;
  };

  it('labels a heading with its text and hides the split pieces, as SplitText does', () => {
    const heading = split('h2');

    expect(heading.getAttribute('aria-label')).toBe('Keeping it alive is the hard part.');
    expect(heading.querySelector('.w')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves a plain paragraph unlabelled (an aria-label is not allowed there) and its words readable', () => {
    const paragraph = split('p');

    expect(paragraph.hasAttribute('aria-label')).toBe(false);
    expect(paragraph.querySelector('.w')?.hasAttribute('aria-hidden')).toBe(false);
    expect(paragraph.textContent).toBe('Keeping it alive is the hard part.');
  });
});
