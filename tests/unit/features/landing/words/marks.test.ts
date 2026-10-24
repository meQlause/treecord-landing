import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as prototype from '../../../../../src/generated/prototype/svg-assets/src/words.js';
import { drawFx } from '../../../../../src/features/landing/words/marks';
import { stubLayout } from '../../../../helpers/layout';
import { describeTimeline, mount } from '../../../../helpers/timelines';

// One headline with every kind of mark, and a swapped-in word.
const SAY = `<div class="say"><p class="big">
  <span class="fx" data-fx="mark">plant</span>
  <span class="fx" data-fx="under">proven</span>
  <span class="fx" data-fx="circle">alive</span>
  <span class="fx" data-fx="ring">first year</span>
  <span class="fx" data-fx="alarm">forgotten</span>
  <span class="fx" data-fx="strike">our word</span>
  <span class="fx fx--new" data-fx="new"><span class="w">staying</span> <span class="w">alive</span></span>
</p></div>`;

let restore = (): void => {};

beforeEach(() => {
  restore = stubLayout();
});

afterEach(() => restore());

// The prototype's own module is the oracle: same overlay markup, same tweens at the same times.
describe('drawFx', () => {
  it('draws the same marks as the prototype: overlay layers byte for byte', () => {
    const ours = mount(SAY);
    const theirs = mount(SAY);

    drawFx(ours);
    prototype.drawFx(theirs);

    expect(ours.innerHTML).toBe(theirs.innerHTML);
  });

  it('plays them on the same timeline as the prototype', () => {
    const ours = mount(SAY);
    const theirs = mount(SAY);

    expect(describeTimeline(drawFx(ours), ours)).toEqual(
      describeTimeline(prototype.drawFx(theirs), theirs),
    );
  });

  it('is paused, with a back layer for highlighters and a front layer for strokes', () => {
    const say = mount(SAY);

    const timeline = drawFx(say);

    expect(timeline.paused()).toBe(true);
    expect(say.querySelectorAll('.fx-layer')).toHaveLength(2);
    expect(say.querySelector('.fx-layer--back svg')).not.toBeNull();
  });

  it('draws a mark on each wrapped line of a word, and skips slivers narrower than 4 px', () => {
    const say = mount(SAY);

    drawFx(say);

    const strikeLines = say.querySelectorAll('.fx-layer:not(.fx-layer--back) svg');
    const slivers = [...say.querySelectorAll('.fx--new')].length;
    // 7 words, each with one full-width line, plus the strike's second line (40 px); the slivers are skipped
    expect(strikeLines.length + say.querySelectorAll('.fx-layer--back svg').length).toBe(8);
    expect(slivers).toBe(1);
  });

  it('gives every mark kind its own ink: green for what is right, red for the problem', () => {
    const say = mount(SAY);

    drawFx(say);

    const front = say.querySelector('.fx-layer:not(.fx-layer--back)')?.innerHTML ?? '';
    expect(front).toContain('stroke="#2E9E5B"');
    expect(front).toContain('stroke="#C8553D"');
  });

  it('measures nothing and draws nothing when the headline has no marks', () => {
    const plain = mount('<div class="say"><p class="big">Plain words</p></div>');

    const timeline = drawFx(plain);

    expect(timeline.getChildren()).toHaveLength(0);
    expect(plain.querySelectorAll('svg')).toHaveLength(0);
  });
});
