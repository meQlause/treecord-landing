// Scroll story. Each beat is pinned; its master timeline is scrubbed by scroll and holds the headlines
// (src/story.js) with their hand-drawn marks, the asset timelines (each 0..1), a drifting ghost word,
// and the camera moves from foundation.md.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { SplitText } from 'gsap/SplitText.js';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin.js';
import { treeSVG, treeGrowth, SEEDLING_VIEWBOX, TREE_VIEWBOX } from './src/tree.js';
import {
  forgottenSVG,
  forgottenTimeline,
  fieldCheckSVG,
  fieldCheckTimeline,
} from './src/scenes.js';
import * as O from './src/objects.js';
import { iconSVG, iconTimeline, ICONS } from './src/icons.js';
import {
  pipelineSVG,
  pipelineTimeline,
  milestonesSVG,
  milestonesTimeline,
} from './src/diagrams.js';
import { STORY as S } from './src/story.js';
import { copyHTML, rich, drawFx, prepare, script } from './src/words.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin);

const $ = (root, sel) => root.querySelector(sel);
const beats = document.getElementById('beats');

// ---------------------------------------------------------------- beats
function section(id, cls, html, ghost) {
  const el = document.createElement('section');
  el.className = `beat ${cls}`;
  el.id = id;
  el.innerHTML = `${ghost ? `<div class="ghost" aria-hidden="true">${ghost}</div>` : ''}${html}<div class="bar"></div>`;
  beats.append(el);
  return el;
}

/** Put an asset timeline (paused, 0..1) into a master at `at`, stretched to `dur`. */
const place = (master, tl, at = 0, dur = 1) => master.add(tl.paused(false).duration(dur), at);

function pin(el, screens, build) {
  const master = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: el,
      start: 'top top',
      end: `+=${screens * 100}%`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
  build(master);
  const d = master.duration();
  const ghost = $(el, '.ghost');
  if (ghost)
    master.fromTo(
      ghost,
      { x: () => innerWidth * 0.15 },
      { x: () => -ghost.offsetWidth * 0.5, duration: d },
      0,
    );
  master.fromTo($(el, '.bar'), { scaleX: 0 }, { scaleX: 1, duration: d }, 0);
  return master;
}

function build() {
  // B0 hook, then the mark assembles
  {
    const el = section(
      'hero',
      'beat--center',
      copyHTML(S.hero.hook, 'hook') +
        `<div class="brand"><div class="mark">${O.logoSVG()}<span class="wordmark">Treecord</span></div>${copyHTML([S.hero.tagline], 'tagline')}</div>`,
      S.hero.ghost,
    );
    $(el, '.tc-logo').style.width = 'clamp(72px, 11vw, 150px)';
    const firstSay = $(el, '.hook .say');
    const first = prepare(firstSay); // measured before the pin wraps anything
    pin(el, 2, (m) => {
      const { end } = script(m, $(el, '.hook'), [null, 0.5, 1.0]);
      place(m, O.logoTimeline($(el, '.tc-logo'), gsap), end - 0.05, 0.8);
      m.from(
        $(el, '.wordmark'),
        { autoAlpha: 0, x: -24, duration: 0.25, ease: 'power3.out' },
        end + 0.3,
      );
      script(m, $(el, '.tagline'), [end + 0.55]);
    });
    // the first line greets on load, before any scroll, and its highlighter swipes in
    gsap
      .timeline({ delay: 0.15 })
      .from(first.words, {
        yPercent: 120,
        rotate: 4,
        stagger: 0.07,
        duration: 0.9,
        ease: 'power4.out',
      })
      .add(first.fx.paused(false).timeScale(0.25), '-=0.35');
  }

  // B1 zoom in on one seedling
  {
    const el = section(
      'seedling',
      'beat--split',
      copyHTML(S.seedling.says) + `<div class="stage">${treeSVG()}</div>`,
      S.seedling.ghost,
    );
    const tree = $(el, '.tc-tree');
    Object.assign(tree.style, {
      width: 'min(100%, 62vh)',
      aspectRatio: '400 / 480',
      overflow: 'visible',
    });
    treeGrowth(tree, gsap).progress(0); // stays a seedling here; it grows in B5
    pin(el, 1.6, (m) => {
      m.fromTo(
        tree,
        { attr: { viewBox: TREE_VIEWBOX } },
        { attr: { viewBox: SEEDLING_VIEWBOX }, duration: 1, ease: 'power2.inOut' },
        0,
      );
      script(m, $(el, '.copy'), [0, 0.6]);
    });
  }

  // B2 pan right across the problems, two headlines per panel
  {
    const assets = [forgottenSVG(), O.blindFundingSVG(), O.certificateSVG()];
    const el = section(
      'problems',
      'beat--strip',
      `<div class="strip">${S.problems.panels.map((says, i) => `<div class="panel">${assets[i]}${copyHTML(says)}</div>`).join('')}</div>`,
      S.problems.ghost,
    );
    const [wilt, blind, cert] = [
      $(el, '.tc-forgotten'),
      $(el, '.tc-blind'),
      $(el, '.tc-certificate'),
    ];
    wilt.style.height = '40vh';
    blind.style.height = '30vh';
    cert.style.height = '36vh';
    const strip = $(el, '.strip');
    const copies = el.querySelectorAll('.copy');
    pin(el, 4.5, (m) => {
      let t = 0;
      [
        forgottenTimeline(wilt, gsap),
        O.blindFundingTimeline(blind, gsap),
        O.certificateTimeline(cert, gsap),
      ].forEach((asset, i) => {
        if (i) {
          m.to(strip, { x: () => -i * innerWidth, duration: 0.8, ease: 'power2.inOut' }, t);
          t += 0.8;
        }
        place(m, asset, t, 0.85);
        t = Math.max(script(m, copies[i], [t + 0.05, t + 0.5]).end, t + 0.9);
      });
    });
  }

  // B3 zoom into the phone
  {
    const el = section(
      'proof',
      'beat--split',
      copyHTML(S.proof.says) +
        `<div class="stage">${O.phoneSVG()}<div style="display:grid;gap:12px;justify-items:center">${fieldCheckSVG()}${O.shieldSVG()}</div></div>`,
      S.proof.ghost,
    );
    const phone = $(el, '.tc-phone');
    Object.assign(phone.style, { height: '72vh', aspectRatio: '320 / 600' });
    $(el, '.tc-field').style.width = 'clamp(170px, 24vw, 330px)';
    $(el, '.tc-shield').style.width = 'clamp(52px, 6vw, 90px)';
    pin(el, 2.8, (m) => {
      place(m, O.phoneTimeline(phone, gsap), 0, 1.2);
      m.to(
        phone,
        { attr: { viewBox: O.PHONE_SCREEN_VIEWBOX }, duration: 0.35, ease: 'power2.inOut' },
        0.4,
      );
      place(m, fieldCheckTimeline($(el, '.tc-field'), gsap), 0.2, 0.6);
      place(m, O.shieldTimeline($(el, '.tc-shield'), gsap), 1.05, 0.35);
      script(m, $(el, '.copy'), [0, 0.4, 0.75, 1.1]);
    });
  }

  // B4 pan right along the pipeline; each headline lands as its node lights
  {
    const el = section(
      'pipeline',
      'beat--stack',
      copyHTML(S.pipeline.says) + `<div class="stage">${pipelineSVG()}</div>`,
      S.pipeline.ghost,
    );
    const svg = $(el, '.tc-pipeline');
    svg.style.width = '100%';
    pin(el, 3.2, (m) => {
      place(m, pipelineTimeline(svg, gsap), 0, 2.4);
      m.fromTo(
        svg,
        { attr: { viewBox: '0 0 800 360' } },
        { attr: { viewBox: '800 0 800 360' }, duration: 2.4 },
        0,
      );
      script(m, $(el, '.copy'), [0, 0.22, 0.84, 1.46, 2.08]);
    });
  }

  // B5 36 months: the line, the payouts and the tree share one progress
  {
    const el = section(
      'survival',
      'beat--stack',
      copyHTML(S.survival.says) +
        `<div class="stage" style="flex-direction:column;gap:2vh">${treeSVG({ seed: 13 })}${milestonesSVG()}</div>`,
      S.survival.ghost,
    );
    const tree = $(el, '.tc-tree');
    Object.assign(tree.style, { height: '32vh', aspectRatio: '400 / 480' });
    $(el, '.tc-milestones').style.width = 'min(1100px, 100%)';
    pin(el, 3.2, (m) => {
      place(m, treeGrowth(tree, gsap), 0.2, 2);
      place(m, milestonesTimeline($(el, '.tc-milestones'), gsap), 0.2, 2);
      script(m, $(el, '.copy'), [0, 0.65, 1.2, 1.75]);
    });
  }

  // B6 zoom out to carbon
  {
    const el = section(
      'carbon',
      'beat--split',
      copyHTML(S.carbon.says) +
        `<div class="stage" style="flex-direction:column">${O.coinSVG({ tone: 'green' })}${O.serialSVG()}</div>`,
      S.carbon.ghost,
    );
    $(el, '.tc-coin').style.width = 'clamp(90px, 12vw, 160px)';
    $(el, '.tc-serial').style.width = 'min(480px, 100%)';
    pin(el, 2, (m) => {
      place(m, O.coinTimeline($(el, '.tc-coin'), gsap), 0.1, 0.5);
      place(m, O.serialTimeline($(el, '.tc-serial'), gsap), 0.9, 0.7);
      script(m, $(el, '.copy'), [0, 0.45, 0.95]);
    });
  }

  // B7 roles, then the call to action
  {
    const { title, items, cta, ghost } = S.roles;
    const el = section(
      'roles',
      'beat--stack',
      copyHTML([title]) +
        `<div class="stage" style="flex-direction:column;justify-content:center">` +
        `<div class="roles">${items.map(([icon, line]) => `<figure>${iconSVG(icon)}<figcaption>${rich(line)}</figcaption></figure>`).join('')}</div>` +
        `<div class="cta-block" style="text-align:center">${copyHTML([{ big: cta.big, size: 'm' }])}<div class="cta"><a class="btn btn--primary" href="#">${cta.primary}</a><a class="btn" href="#">${cta.secondary}</a></div></div>` +
        `</div>`,
      ghost,
    );
    el.querySelectorAll('.tc-icon').forEach((s) => (s.style.width = 'clamp(56px, 8vw, 104px)'));
    const [titleCopy, ctaCopy] = el.querySelectorAll('.copy');
    pin(el, 2, (m) => {
      script(m, titleCopy, [0]);
      el.querySelectorAll('.roles figure').forEach((fig, i) => {
        const caption = $(fig, 'figcaption');
        place(m, iconTimeline($(fig, '.tc-icon'), gsap), 0.25 + i * 0.14, 0.4);
        m.from(caption, { autoAlpha: 0, y: 14, duration: 0.1 }, 0.35 + i * 0.14);
        m.add(drawFx(caption).paused(false), 0.45 + i * 0.14);
      });
      script(m, ctaCopy, [1.2]);
      m.from(
        el.querySelectorAll('.btn'),
        { autoAlpha: 0, y: 16, stagger: 0.05, duration: 0.12 },
        1.45,
      );
    });
  }

  // asset sheet: every asset in its final state (review only)
  {
    const items = [
      ['logo', O.logoSVG()],
      ['tree', treeSVG()],
      ['coin gold', O.coinSVG()],
      ['coin green', O.coinSVG({ tone: 'green' })],
      ['blind funding', O.blindFundingSVG()],
      ['certificate', O.certificateSVG()],
      ['phone', O.phoneSVG()],
      ['gps', O.gpsSVG()],
      ['forgotten', forgottenSVG()],
      ['field check', fieldCheckSVG()],
      ['shield', O.shieldSVG()],
      ['serial', O.serialSVG()],
      ...Object.keys(ICONS).map((k) => [`icon ${k}`, iconSVG(k)]),
      ['pipeline', pipelineSVG()],
      ['milestones', milestonesSVG()],
    ];
    const sheet = document.getElementById('sheet');
    sheet.innerHTML = items
      .map(
        ([name, s]) =>
          `<div class="cell"${name === 'pipeline' || name === 'milestones' ? ' style="grid-column:1/-1"' : ''}>${s}<span>${name}</span></div>`,
      )
      .join('');
    sheet.querySelectorAll('[data-text]').forEach((t) => (t.textContent = t.dataset.text));
  }
}

// Split and measure only after the fonts are in: line breaks and mark positions depend on the real font.
document.fonts.ready.then(() => {
  build();
  ScrollTrigger.refresh();
  // ?at=pipeline,0.5 jumps to a beat at a given progress (screenshots, quick review)
  const at = new URLSearchParams(location.search).get('at');
  if (!at) return;
  const [id, p] = at.split(',');
  if (id === 'sheet') return document.getElementById('sheet').scrollIntoView();
  const st = ScrollTrigger.getAll().find((s) => s.trigger?.id === id);
  if (st) window.scrollTo(0, st.start + (st.end - st.start) * +p);
});

// ponytail: marks and masks are measured once, so a real width change reloads the preview.
let lastWidth = innerWidth;
addEventListener('resize', () => {
  clearTimeout(window.__reflow);
  window.__reflow = setTimeout(
    () => Math.abs(innerWidth - lastWidth) > 40 && location.reload(),
    300,
  );
});
