import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { drawFx } from '../../../../../src/features/landing/words/marks';
import { stubLayout } from '../../../../helpers/layout';
import { mount } from '../../../../helpers/timelines';

const GREEN = '#2E9E5B';
const RED = '#C8553D';
const MUTED = '#6B726E';
const PENDING = '#D9A23A';

// The stubbed layout gives a marked word one box (50 x 30 at 10, 20 inside a page that starts at 5, 5). A strike
// wraps onto a second line 40 px wide; every other word's second line is a 3 px sliver the engine must skip.
const headline = (...words: string[]): HTMLElement =>
  mount(`<div class="say"><p class="big">${words.join(' ')}</p></div>`);

const word = (kind: string, text = 'word'): string =>
  kind === 'new'
    ? `<span class="fx fx--new" data-fx="new"><span class="w">${text}</span></span>`
    : `<span class="fx" data-fx="${kind}">${text}</span>`;

const front = (say: Element) => say.querySelectorAll('.fx-layer:not(.fx-layer--back) > svg');
const back = (say: Element) => say.querySelectorAll('.fx-layer--back > svg');

const tweensOn = (timeline: ReturnType<typeof drawFx>, target: Element) =>
  timeline.getChildren(false, true, false).filter((tween) => tween.targets().includes(target));

let restore = (): void => {};

beforeEach(() => {
  restore = stubLayout();
});

afterEach(() => restore());

describe('drawFx layers', () => {
  it('is paused, with a back layer for highlighters and a front layer for strokes', () => {
    const say = headline(word('mark'), word('under'));

    const timeline = drawFx(say);

    expect(timeline.paused()).toBe(true);
    expect(say.querySelectorAll('.fx-layer')).toHaveLength(2);
    expect(say.querySelector('.fx-layer--back')).not.toBeNull();
  });

  it('puts the highlighter behind the words and every other mark in front', () => {
    const say = headline(word('mark'), word('under'), word('circle'), word('strike'));

    drawFx(say);

    expect(back(say)).toHaveLength(1);
    expect(back(say)[0].querySelector('polygon')).not.toBeNull();
    expect(front(say).length).toBeGreaterThan(0);
    expect([...front(say)].every((svg) => svg.querySelector('polygon') === null)).toBe(true);
  });

  it('hides every drawn mark from assistive technology', () => {
    const say = headline(word('mark'), word('circle'), word('strike'));

    drawFx(say);

    const drawn = [...back(say), ...front(say)];
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every((svg) => svg.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('measures nothing and draws nothing when the headline has no marks', () => {
    const plain = mount('<div class="say"><p class="big">Plain words</p></div>');

    const timeline = drawFx(plain);

    expect(timeline.getChildren()).toHaveLength(0);
    expect(plain.querySelectorAll('svg')).toHaveLength(0);
  });
});

describe('drawFx marks, one per kind', () => {
  it('sizes the highlighter to its word, a little wider and about two thirds as tall', () => {
    const say = headline(word('mark'));

    drawFx(say);

    const svg = back(say)[0];
    expect(svg.getAttribute('viewBox')).toBe('0 0 64.0 21.6'); // 50 + 14 wide, 30 * 0.72 tall
    expect(svg.getAttribute('style')).toContain('left: -2px'); // 10 - 5, then 7 px to the left
    expect(svg.querySelector('polygon')?.getAttribute('fill')).toBe(PENDING);
    expect(svg.querySelector('polygon')?.getAttribute('fill-opacity')).toBe('0.5');
  });

  it.each([
    ['under', GREEN],
    ['circle', GREEN],
    ['new', GREEN],
    ['alarm', RED],
    ['strike', RED],
    ['ring', RED],
  ])('draws %s in its ink: green for what is right, red for the problem', (kind, ink) => {
    const say = headline(word(kind));

    drawFx(say);

    const paths = [...front(say)].flatMap((svg) => [...svg.querySelectorAll('path')]);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((path) => path.getAttribute('stroke') === ink)).toBe(true);
  });

  it('keeps the stroke width even: a tenth of the word height, but never under 2.5 px', () => {
    const say = headline(word('under'));

    drawFx(say);

    expect(front(say)[0].querySelector('path')?.getAttribute('stroke-width')).toBe('2.5');
  });

  it('draws a loop around the word, wider and taller than it, for circle and ring alike', () => {
    for (const kind of ['circle', 'ring']) {
      const say = headline(word(kind));

      drawFx(say);

      expect(front(say)).toHaveLength(1);
      expect(front(say)[0].getAttribute('viewBox')).toBe('0 0 64.0 37.5'); // 50 * 1.28 by 30 * 1.25
      expect(front(say)[0].querySelectorAll('path')).toHaveLength(1);
    }
  });

  it('draws a strike as two scribbles on every line the word wraps onto', () => {
    const say = headline(word('strike', 'our word'));

    drawFx(say);

    expect(front(say)).toHaveLength(2); // the 50 px line and the 40 px wrapped line
    expect([...front(say)].map((svg) => svg.querySelectorAll('path').length)).toEqual([2, 2]);
  });

  it('skips a line narrower than 4 px: nothing is drawn on a sliver', () => {
    const say = headline(word('new'), word('under'));

    drawFx(say);

    // each has a 50 px first line and a 3 px second line: one svg each
    expect(front(say)).toHaveLength(2);
  });

  it('draws the underline of a word that is swapped in, below its text', () => {
    const say = headline(word('under'), word('new'));

    drawFx(say);

    const tops = [...front(say)].map(
      (svg) => svg.getAttribute('style')?.match(/top:([\d.]+)px/)?.[1],
    );
    expect(tops).toHaveLength(2);
    expect(Number(tops[0])).toBeGreaterThan(15 + 30 * 0.7); // below the word's top (20 - 5) plus most of its height
  });

  it('draws a different scribble for an alarm than for a plain underline', () => {
    const alarm = headline(word('alarm'));
    const plain = headline(word('under'));

    drawFx(alarm);
    drawFx(plain);

    const pathOf = (say: Element) => front(say)[0].querySelector('path')?.getAttribute('d');
    expect(pathOf(alarm)).not.toBe(pathOf(plain));
  });
});

describe('drawFx timeline', () => {
  it('tweens each mark in once, and a coloured mark also colours its word', () => {
    const say = headline(word('mark'), word('circle'), word('ring'), word('alarm'), word('under'));

    const timeline = drawFx(say);

    // mark 1 + circle 2 + ring 2 + alarm 2 + under 1
    expect(timeline.getChildren(false, true, false)).toHaveLength(8);
    const colour = (kind: string) => {
      const target = say.querySelector(`[data-fx=${kind}]`) as Element;

      return tweensOn(timeline, target).map((tween) => (tween.vars as { color?: string }).color);
    };
    expect(colour('circle')).toContain(GREEN);
    expect(colour('ring')).toContain(RED);
    expect(colour('alarm')).toContain(RED);
    expect(colour('mark')).toEqual([]);
    expect(colour('under')).toEqual([]);
  });

  it('fades a struck word to grey as the scribble crosses it out', () => {
    const say = headline(word('strike', 'our word'));

    const timeline = drawFx(say);

    const target = say.querySelector('[data-fx=strike]') as Element;
    const fade = tweensOn(timeline, target).find((tween) => 'color' in tween.vars);
    expect(fade?.vars).toMatchObject({ color: MUTED, opacity: 0.55 });
  });

  it('turns a swapped-in word green once its words have risen', () => {
    const say = headline(word('new'));

    const timeline = drawFx(say);

    const target = say.querySelector('[data-fx=new]') as Element;
    expect(
      tweensOn(timeline, target).map((tween) => (tween.vars as { color?: string }).color),
    ).toContain(GREEN);
    expect(
      timeline
        .getChildren(false, true, false)
        .some((tween) => tween.targets().includes(say.querySelector('.w') as Element)),
    ).toBe(true);
  });

  it('plays marks one after another: 0.11 apart, and 0.16 after a strike', () => {
    const say = headline(word('mark'), word('under'), word('strike'), word('circle'));

    const timeline = drawFx(say);

    const starts = timeline.getChildren(false, true, false).map((tween) => tween.startTime());
    const startsAt = (time: number) => starts.some((start) => Math.abs(start - time) < 1e-6);
    expect(startsAt(0)).toBe(true); // the highlighter
    expect(startsAt(0.11)).toBe(true); // the underline, after the highlighter
    expect(startsAt(0.22)).toBe(true); // the strike, after the underline
    expect(startsAt(0.38)).toBe(true); // the loop: 0.22 plus the strike's longer 0.16
  });

  it('draws a strike as two scribbles: the second starts after the first and is drawn back the other way', () => {
    const say = headline(word('strike'));

    const timeline = drawFx(say);

    const startAt = (tween: { vars: object }) =>
      (tween.vars as { startAt?: { drawSVG?: string } }).startAt?.drawSVG;
    const tweens = timeline.getChildren(false, true, false);
    const firsts = tweens.filter((tween) => startAt(tween) === '0%');
    const seconds = tweens.filter((tween) => startAt(tween) === '100% 100%');
    expect(firsts).toHaveLength(2); // one per line the word wraps onto
    expect(seconds).toHaveLength(2);
    expect(firsts.every((tween) => tween.startTime() === 0)).toBe(true);
    expect(seconds.every((tween) => Math.abs(tween.startTime() - 0.08) < 1e-6)).toBe(true);
  });
});
