// Words engine shared by svg-assets/preview.js and landing/main.js: story markup with inline marks,
// masked word reveals (SplitText) and hand-drawn marks (DrawSVG), all as scrubbable timeline pieces.
// Needs ScrollTrigger-free GSAP with SplitText and DrawSVGPlugin registered by the page.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText.js';
import { HEX } from '../../three-assets/src/palette.js';

const $ = (root, sel) => root.querySelector(sel);

// ---------------------------------------------------------------- copy markup
const FX_RE = /\{(\w+):([^}]+)\}/g;
/** "{circle:alive}" -> <span class="fx" data-fx="circle">alive</span>; see the legend in story.js */
export const rich = (text) =>
  text.replace(FX_RE, (_, kind, body) => {
    if (kind === 'num') return `<span class="num">${body}</span>`;
    if (kind === 'swap') {
      const [was, now] = body.split('|');
      return `<span class="fx" data-fx="strike">${was}</span> <span class="fx fx--new" data-fx="new">${now}</span>`;
    }
    return `<span class="fx" data-fx="${kind}">${body}</span>`;
  });
export const sayHTML = ({ big, size }) =>
  `<div class="say"><p class="big${size ? ` big--${size}` : ''}">${rich(big)}</p></div>`;
export const copyHTML = (says, cls = '') =>
  `<div class="copy ${cls}">${says.map(sayHTML).join('')}</div>`;

// ---------------------------------------------------------------- hand-drawn marks
// Paths are drawn in a normalised box (100 x 20, circle 100 x 40) and scaled to the word's real size,
// so stroke width stays even and DrawSVG lengths stay exact.
const SCRIBBLE = {
  under: ['M2,13 C18,8 30,18 48,12 S78,9 98,13'],
  alarm: ['M2,12 C8,17 14,7 22,12 S34,17 42,12 S54,7 62,12 S74,17 82,12 S94,8 98,11'],
  strike: ['M1,11 C30,8 65,14 99,9', 'M4,14 C35,11 70,16 97,11'],
  circle: ['M52,5 C80,3 98,11 97,20 C96,32 70,37 46,36 C20,35 3,29 4,18 C5,8 28,3 62,6'],
};
// green = what Treecord does right, red = the problem
const INK = {
  under: HEX.verified,
  circle: HEX.verified,
  new: HEX.verified,
  alarm: HEX.flagged,
  strike: HEX.flagged,
  ring: HEX.flagged,
};
// Strokes start at opacity 0 too: a 0% stroke with round caps would still paint a dot.
const scale = (d, sx, sy) =>
  d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => `${(x * sx).toFixed(1)},${(y * sy).toFixed(1)}`);

/**
 * Measure every .fx word inside `box`, draw its mark in an overlay layer, and return a paused timeline
 * that plays the marks one after another. Call after the fonts load, after SplitText has split `box`,
 * and before any ancestor is scaled (positions are read from layout).
 * ponytail: positions are measured once; the pages reload on a real width change. A production page
 * would re-measure in SplitText's onSplit with autoSplit.
 */
export function drawFx(box) {
  const tl = gsap.timeline({ paused: true });
  const base = box.getBoundingClientRect();
  const layer = (cls) =>
    box.appendChild(Object.assign(document.createElement('div'), { className: cls }));
  const back = layer('fx-layer fx-layer--back');
  const front = layer('fx-layer');
  const svgAt = (parent, x, y, w, h, body) => {
    parent.insertAdjacentHTML(
      'beforeend',
      `<svg viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" aria-hidden="true">${body}</svg>`,
    );
    return parent.lastElementChild;
  };

  let t = 0;
  box.querySelectorAll('.fx').forEach((el) => {
    const kind = el.dataset.fx;
    const color = INK[kind];
    for (const r of [...el.getClientRects()].filter((rect) => rect.width > 4)) {
      const x = r.left - base.left;
      const y = r.top - base.top;
      const sw = Math.max(2.5, r.height * 0.07);
      const stroke = (d) =>
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;

      if (kind === 'mark') {
        const [w, h] = [r.width + 14, r.height * 0.72];
        const s = svgAt(
          back,
          x - 7,
          y + r.height * 0.18,
          w,
          h,
          `<polygon points="0,${h * 0.25} ${w},${h * 0.05} ${w * 0.97},${h * 0.85} ${w * 0.02},${h}" fill="${HEX.pending}" fill-opacity="0.5"/>`,
        );
        tl.fromTo(
          s,
          { scaleX: 0 },
          { scaleX: 1, transformOrigin: '0% 50%', duration: 0.12, ease: 'power2.out' },
          t,
        );
      } else if (kind === 'circle' || kind === 'ring') {
        const [w, h] = [r.width * 1.28, r.height * 1.25];
        const s = svgAt(
          front,
          x - r.width * 0.14,
          y - r.height * 0.12,
          w,
          h,
          stroke(scale(SCRIBBLE.circle[0], w / 100, h / 40)),
        );
        tl.fromTo(
          s.querySelector('path'),
          { drawSVG: '0%', opacity: 0 },
          { drawSVG: '100%', opacity: 1, duration: 0.16, ease: 'power1.inOut' },
          t,
        );
        tl.to(el, { color, duration: 0.08 }, t + 0.04);
      } else if (kind === 'strike') {
        const [w, h] = [r.width + 8, r.height * 0.3];
        const s = svgAt(
          front,
          x - 4,
          y + r.height * 0.4,
          w,
          h,
          SCRIBBLE.strike.map((d) => stroke(scale(d, w / 100, h / 20))).join(''),
        );
        const [a, b] = s.querySelectorAll('path');
        tl.fromTo(
          a,
          { drawSVG: '0%', opacity: 0 },
          { drawSVG: '100%', opacity: 1, duration: 0.08, ease: 'none' },
          t,
        )
          .fromTo(
            b,
            { drawSVG: '100% 100%', opacity: 0 },
            { drawSVG: '0% 100%', opacity: 1, duration: 0.07, ease: 'none' },
            t + 0.08,
          )
          .to(el, { color: HEX.muted, opacity: 0.55, duration: 0.08 }, t + 0.06);
      } else {
        // under, alarm, and the underline of a swapped-in word
        const [w, h] = [r.width + 8, r.height * 0.3];
        const s = svgAt(
          front,
          x - 4,
          y + r.height * 0.78,
          w,
          h,
          stroke(scale(SCRIBBLE[kind === 'alarm' ? 'alarm' : 'under'][0], w / 100, h / 20)),
        );
        if (kind === 'new')
          tl.from(
            el.querySelectorAll('.w'),
            {
              yPercent: 120,
              opacity: 0,
              rotate: 4,
              stagger: 0.02,
              duration: 0.12,
              ease: 'power4.out',
            },
            t,
          );
        tl.fromTo(
          s.querySelector('path'),
          { drawSVG: '0%', opacity: 0 },
          { drawSVG: '100%', opacity: 1, duration: 0.12, ease: 'power1.out' },
          t + (kind === 'new' ? 0.08 : 0),
        );
        if (kind === 'alarm') tl.to(el, { color: HEX.flagged, duration: 0.08 }, t);
        if (kind === 'new') tl.to(el, { color: HEX.verified, duration: 0.01 }, t);
      }
    }
    t += kind === 'strike' ? 0.16 : 0.11;
  });
  return tl;
}

/** Split one say into masked words and draw its marks. Words of a swapped-in phrase wait for their mark. */
export function prepare(say) {
  // linesClass "ln" gives the masks class "ln-mask"; the pages pad that mask so descenders (g, y) are not clipped
  const split = SplitText.create($(say, '.big'), {
    type: 'words, lines',
    mask: 'lines',
    wordsClass: 'w',
    linesClass: 'ln',
  });
  return { words: split.words.filter((w) => !w.closest('.fx--new')), fx: drawFx(say) };
}

/** Reading time a headline gets after its last mark has drawn (timeline units; 1 unit ≈ one screen of scroll). */
export const HOLD = 0.4;
const REVEAL = 0.17; // words rising before the marks start

/** One headline: words rise out of their line masks at `at`, its marks draw right after, it leaves at `until`. */
export function speak(m, say, at, until, prepared = at !== null ? prepare(say) : null) {
  if (prepared) {
    // opacity too, not only the mask: raised step numbers ({num:}) sit partly outside their line mask
    m.from(
      prepared.words,
      {
        yPercent: 120,
        opacity: 0,
        rotate: 4,
        duration: 0.14,
        stagger: { amount: 0.06 },
        ease: 'power4.out',
      },
      at,
    );
    m.add(prepared.fx.paused(false), at + REVEAL);
  }
  if (until != null)
    m.to(say, { autoAlpha: 0, y: -28, duration: 0.07, ease: 'power2.in' }, until - 0.07);
}

/**
 * Speak each .say of a .copy. times[i] is the earliest a say may start; it starts later if the previous
 * one has not finished drawing its marks and been on screen for HOLD (so a {swap:} is never cut off).
 * Each say leaves when the next arrives. An extra trailing time (times[says.length]) makes the last say
 * leave too. A null time means "already shown" (the greeting on load).
 * Returns { at, end }: the actual start times, and when the copy is done (last exit, or last say read).
 */
export function script(m, copy, times) {
  const says = [...copy.querySelectorAll('.say')];
  const prepared = says.map((say, i) => (times[i] === null ? null : prepare(say)));
  const at = [];
  let ready = 0;
  says.forEach((_, i) => {
    if (times[i] === null) {
      at.push(null);
      ready = HOLD;
      return;
    }
    const t = Math.max(times[i], ready);
    at.push(t);
    ready = t + REVEAL + prepared[i].fx.duration() + HOLD;
  });
  const exit = times.length > says.length ? Math.max(times[says.length], ready) : null;
  says.forEach((say, i) =>
    speak(m, say, at[i], i + 1 < says.length ? at[i + 1] : exit, prepared[i]),
  );
  const end = exit ?? ready;
  if (exit === null) m.set({}, {}, end); // the last line rests on screen before the beat moves on
  return { at, end };
}

/** The first headline of a page greets on load (not on scroll): words rise, then its marks draw. */
export function greet(say) {
  const { words, fx } = prepare(say);
  return gsap
    .timeline({ delay: 0.15 })
    .from(words, {
      yPercent: 120,
      opacity: 0,
      rotate: 4,
      stagger: 0.07,
      duration: 0.9,
      ease: 'power4.out',
    })
    .add(fx.paused(false).timeScale(0.25), '-=0.35');
}
