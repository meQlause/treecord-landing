import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as prototype from '../../../../../../svg-assets/src/words.js';
import {
  HOLD,
  greet,
  prepare,
  script,
  speak,
} from '../../../../../src/features/landing/words/script';
import { stubLayout } from '../../../../helpers/layout';
import { describeTimeline, mount } from '../../../../helpers/timelines';

const SAYS = [
  '<div class="say"><p class="big">Anyone can <span class="fx" data-fx="mark">plant</span> a tree.</p></div>',
  '<div class="say"><p class="big">Keeping it <span class="fx" data-fx="circle">alive</span> is hard.</p></div>',
  '<div class="say"><p class="big">We pay for <span class="fx" data-fx="strike">planting</span> <span class="fx fx--new" data-fx="new"><span>staying alive.</span></span></p></div>',
];
const copy = (count = SAYS.length): HTMLElement =>
  mount(`<div class="copy">${SAYS.slice(0, count).join('')}</div>`);

// The one deliberate difference from the prototype: it labels every split line, which is only valid on a
// heading, so the markup is compared without the aria attributes and the aria behaviour is tested on its own.
const withoutAria = (html: string): string => html.replace(/ aria-(label|hidden)="[^"]*"/g, '');
const REVEAL = 0.17;
const TIMES = [null, 0.5, 1];

let restore = (): void => {};

beforeAll(() => {
  gsap.registerPlugin(SplitText);
});

beforeEach(() => {
  restore = stubLayout();
});

afterEach(() => restore());

// The prototype's own module is the oracle: same words, same marks, same cues, same tweens.
describe('prepare', () => {
  it('splits a headline into masked words and draws its marks, like the prototype', () => {
    const ours = mount(SAYS[2]);
    const theirs = mount(SAYS[2]);

    const mine = prepare(ours);
    const prior = prototype.prepare(theirs);

    expect(withoutAria(ours.innerHTML)).toBe(withoutAria(theirs.innerHTML));
    expect(mine.words).toHaveLength(prior.words.length);
    expect(describeTimeline(mine.fx, ours)).toEqual(describeTimeline(prior.fx, theirs));
  });

  it('leaves the words of a swapped-in phrase out: they wait for their mark', () => {
    const say = mount(SAYS[2]);

    const { words } = prepare(say);

    expect(words.some((word) => word.closest('.fx--new'))).toBe(false);
    expect(say.querySelector('.fx--new .w')).not.toBeNull();
  });
});

describe('script', () => {
  it.each([
    ['a greeting already on screen', TIMES],
    ['every headline cued', [0, 0.3, 0.6]],
    ['a trailing time that makes the last headline leave', [0, 0.3, 0.6, 9]],
  ])('builds the same timeline as the prototype with %s', (_name, times) => {
    const ours = copy();
    const theirs = copy();
    const mine = gsap.timeline({ paused: true });
    const prior = gsap.timeline({ paused: true });

    const result = script(mine, ours, times);
    const expected = prototype.script(prior, theirs, times);

    expect(result).toEqual(expected);
    expect(describeTimeline(mine, ours)).toEqual(describeTimeline(prior, theirs));
    expect(withoutAria(ours.innerHTML)).toBe(withoutAria(theirs.innerHTML));
  });

  it('skips a headline whose time is null and holds the next one for HOLD', () => {
    const { at } = script(gsap.timeline({ paused: true }), copy(), TIMES);

    expect(at[0]).toBeNull();
    expect(at[1]).toBeCloseTo(0.5); // the greeting counts as read, so the cue (0.5) is later than HOLD (0.4)
    expect(HOLD).toBeCloseTo(0.4);
  });

  it('delays a headline until the one before it has drawn its marks and been on screen for HOLD', () => {
    const { at } = script(gsap.timeline({ paused: true }), copy(2), [0, 0.1]);

    expect(at[1]).toBeGreaterThan(0.1);
    expect(at[1]).toBeGreaterThanOrEqual(REVEAL + HOLD);
  });

  it('ends where the last headline has been read when there is no trailing time, and rests there', () => {
    const master = gsap.timeline({ paused: true });

    const { at, end } = script(master, copy(2), [0, 0.3]);

    expect(end).toBeGreaterThan(at[1] ?? 0);
    expect(master.duration()).toBeGreaterThanOrEqual(end);
  });

  it('ends at the trailing time when it is later, and makes the last headline leave then', () => {
    const master = gsap.timeline({ paused: true });
    const say = copy(2);

    const { end } = script(master, say, [0, 0.3, 9]);

    expect(end).toBeCloseTo(9);
    expect(
      master.getChildren().some((tween) => Math.abs(tween.startTime() - (9 - 0.07)) < 1e-6),
    ).toBe(true);
  });
});

describe('speak', () => {
  it('adds nothing for a headline that is already on screen and stays', () => {
    const master = gsap.timeline({ paused: true });

    speak(master, mount(SAYS[0]), { at: null, until: null }, null);

    expect(master.getChildren()).toHaveLength(0);
  });

  it('makes a headline leave 0.07 before `until`', () => {
    const master = gsap.timeline({ paused: true });

    speak(master, mount(SAYS[0]), { at: null, until: 3 }, null);

    expect(master.getChildren()).toHaveLength(1);
    expect(master.getChildren()[0].startTime()).toBeCloseTo(3 - 0.07);
  });
});

describe('greet', () => {
  it('raises the first headline on load and draws its marks slowly, like the prototype', () => {
    const ours = mount(SAYS[1]);
    const theirs = mount(SAYS[1]);

    const mine = greet(ours);
    const prior = prototype.greet(theirs);

    expect(withoutAria(ours.innerHTML)).toBe(withoutAria(theirs.innerHTML));
    expect(mine.delay()).toBe(prior.delay());
    expect(describeTimeline(mine, ours)).toEqual(describeTimeline(prior, theirs));
  });
});

describe('prepare and assistive technology', () => {
  const split = (tag: 'p' | 'h2') => {
    const say = document.createElement('div');
    say.innerHTML = `<div class="say"><${tag} class="big">Keeping it alive is the hard part.</${tag}></div>`;
    const restore = stubLayout();
    prepare(say.firstElementChild as Element);
    restore();

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
