// Treecord landing: one pinned stage (foundation.md). Three layers move on one scroll-scrubbed timeline:
// the 3D forest (stage3d.js, via `rig`), the SVG assets, and the headlines with their hand-drawn marks.
// Beats are stacked on top of each other; the camera moves between them: zoom in, pan right, pan left, zoom out.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { SplitText } from 'gsap/SplitText.js';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin.js';
import {
  forgottenSVG,
  forgottenTimeline,
  fieldCheckSVG,
  fieldCheckTimeline,
} from '../svg-assets/src/scenes.js';
import * as O from '../svg-assets/src/objects.js';
import { iconSVG, iconTimeline } from '../svg-assets/src/icons.js';
import {
  pipelineSVG,
  pipelineTimeline,
  milestonesSVG,
  milestonesTimeline,
} from '../svg-assets/src/diagrams.js';
import { STORY as S } from '../svg-assets/src/story.js';
import { copyHTML, rich, drawFx, script, greet } from '../svg-assets/src/words.js';
import { createStage3D, POSE_KEYS } from './stage3d.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin);

const $ = (root, sel) => root.querySelector(sel);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const stage = document.getElementById('stage');
if (!reduce) stage.dataset.motion = '';

/** Put an asset timeline (paused, 0..1) into a timeline at `at`, stretched to `dur`. */
const place = (tl, asset, at = 0, dur = 1) => tl.add(asset.paused(false).duration(dur), at);

// Camera poses at the start of each beat (rig keys, see stage3d.js). Pans move in x, zooms in distance.
// The 2D beats (problems, proof, pipeline) lift the camera above the canopy and look at the horizon:
// with the fog pulled in, the backdrop turns to calm paper and the SVG reads cleanly.
const POSES = {
  hero: {
    px: 0,
    py: 5.5,
    pz: 26,
    lx: 0,
    ly: 6,
    lz: 0,
    dim: 0,
    heroGrowth: 0,
    focus: 0,
    carbon: 0,
    cluster: 0,
    clouds: 1,
  },
  seedling: { px: 1.0, py: 2.6, pz: 4.6, lx: -1.1, ly: 0.1, lz: 0, dim: 0.55, focus: 1 },
  problems: { px: 4, py: 18, pz: 30, lx: 4, ly: 18, lz: 0, dim: 1, focus: 0 },
  proof: { px: 18, py: 18, pz: 24, lx: 18, ly: 18, lz: 0, dim: 1 },
  pipeline: { px: 20, py: 18, pz: 24, lx: 20, ly: 18, lz: 0, dim: 1 },
  survival: { px: 3.5, py: 3.2, pz: 13, lx: -2.8, ly: 3.4, lz: 0, dim: 0.08, focus: 1 }, // tree framed right, words left
  carbon: {
    px: 0,
    py: 24,
    pz: 40,
    lx: 0,
    ly: 10,
    lz: -16,
    dim: 0,
    focus: 0,
    cluster: 1,
    clouds: 0.3,
  }, // thin clouds: the coin must read
  roles: {
    px: 0,
    py: 5,
    pz: 26,
    lx: 0,
    ly: 10,
    lz: 0,
    dim: 0.45,
    cluster: 0,
    carbon: 0,
    clouds: 1,
  },
};
const pose = (name) =>
  Object.fromEntries(Object.entries(POSES[name]).filter(([k]) => POSE_KEYS.includes(k)));

// ---------------------------------------------------------------- beats
// Each beat: markup, the camera move that brings it in, and build(tl, rig) for everything inside it.
const BEATS = [
  {
    id: 'hero',
    cls: 'beat--hero',
    html: () =>
      copyHTML(S.hero.hook, 'hook') +
      `<div class="brand"><div class="mark">${O.logoSVG()}<span class="wordmark">Treecord</span></div>${copyHTML([S.hero.tagline], 'tagline')}</div>`,
    build(tl, el, rig) {
      $(el, '.tc-logo').style.width = 'clamp(72px, 11vw, 150px)';
      // script() returns when the hook has really been read; the mark assembles only then
      const { end } = script(tl, $(el, '.hook'), [null, 0.5, 1.0]);
      place(tl, O.logoTimeline($(el, '.tc-logo'), gsap), end - 0.05, 0.8);
      tl.from(
        $(el, '.wordmark'),
        { autoAlpha: 0, x: -24, duration: 0.25, ease: 'power3.out' },
        end + 0.3,
      );
      script(tl, $(el, '.tagline'), [end + 0.55]);
      tl.to(rig, { pz: 21, py: 4.8, duration: tl.duration(), ease: 'sine.inOut' }, 0);
    },
  },
  {
    id: 'seedling',
    enter: 'zoomIn',
    cls: 'beat--split',
    html: () => copyHTML(S.seedling.says) + `<div></div>`, // the seedling itself is the 3D hero tree
    build(tl, el, rig) {
      script(tl, $(el, '.copy'), [0, 0.6]);
      tl.to(rig, { pz: 3.8, py: 2.2, duration: tl.duration(), ease: 'sine.inOut' }, 0);
    },
  },
  {
    id: 'problems',
    enter: 'panRight',
    cls: 'beat--strip',
    html: () => {
      const assets = [forgottenSVG(), O.blindFundingSVG(), O.certificateSVG()];
      return `<div class="strip">${S.problems.panels.map((says, i) => `<div class="panel">${assets[i]}${copyHTML(says)}</div>`).join('')}</div>`;
    },
    build(tl, el, rig) {
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
      // each panel plays its asset and both headlines; the strip only slides on once they have been read
      let t = 0;
      [
        forgottenTimeline(wilt, gsap),
        O.blindFundingTimeline(blind, gsap),
        O.certificateTimeline(cert, gsap),
      ].forEach((asset, i) => {
        if (i) {
          tl.to(
            strip,
            {
              x: () => (stage.dataset.motion === undefined ? 0 : -i * innerWidth),
              duration: 0.8,
              ease: 'power2.inOut',
            },
            t,
          );
          t += 0.8;
        }
        place(tl, asset, t, 0.85);
        t = Math.max(script(tl, copies[i], [t + 0.05, t + 0.5]).end, t + 0.9);
      });
      tl.to(rig, { px: 16, lx: 16, duration: t }, 0); // the forest drifts behind the strip: parallax
    },
  },
  {
    id: 'proof',
    enter: 'zoomIn',
    cls: 'beat--split',
    html: () =>
      copyHTML(S.proof.says) +
      `<div class="stage-box">${O.phoneSVG()}<div style="display:grid;gap:12px;justify-items:center">${fieldCheckSVG()}${O.shieldSVG()}</div></div>`,
    build(tl, el, rig) {
      const phone = $(el, '.tc-phone');
      Object.assign(phone.style, { height: '70vh', aspectRatio: '320 / 600' });
      $(el, '.tc-field').style.width = 'clamp(170px, 24vw, 330px)';
      $(el, '.tc-shield').style.width = 'clamp(52px, 6vw, 90px)';
      const { at, end } = script(tl, $(el, '.copy'), [0, 0.4, 0.75, 1.1]);
      // the phone records through the first lines, the values lock with "GPS and time", the seal lands with "Rejected"
      place(tl, O.phoneTimeline(phone, gsap), 0, at[3]);
      tl.to(
        phone,
        { attr: { viewBox: O.PHONE_SCREEN_VIEWBOX }, duration: 0.35, ease: 'power2.inOut' },
        at[1],
      );
      place(tl, fieldCheckTimeline($(el, '.tc-field'), gsap), 0.2, at[2] + 0.2);
      place(tl, O.shieldTimeline($(el, '.tc-shield'), gsap), at[3] + 0.1, 0.35);
      tl.to(rig, { pz: 21, duration: end }, 0);
    },
  },
  {
    id: 'pipeline',
    enter: 'panRight',
    cls: 'beat--stack',
    html: () => copyHTML(S.pipeline.says) + `<div class="stage-box">${pipelineSVG()}</div>`, // no glass: a 2D beat, the paper backdrop is calm enough
    build(tl, el, rig) {
      const svg = $(el, '.tc-pipeline');
      // height-bound so the panel always fits its row on short screens (landscape tablets) and never rides up over the words
      // overflow visible: the path is not cropped at the box, it runs on to both screen edges while the camera pans
      if (stage.dataset.motion !== undefined)
        Object.assign(svg.style, {
          height: 'min(40vh, 38vw)',
          aspectRatio: '800 / 360',
          maxWidth: '100%',
          overflow: 'visible',
        });
      else svg.style.width = '100%';
      // the proof sets off once "Proof in. Payment out." has been read; each caption lands just before its node lights
      const start = 0.55;
      const D = 2.4;
      place(tl, pipelineTimeline(svg, gsap), start, D);
      if (stage.dataset.motion !== undefined)
        tl.fromTo(
          svg,
          { attr: { viewBox: '0 0 800 360' } },
          { attr: { viewBox: '800 0 800 360' }, duration: D },
          start,
        );
      script(tl, $(el, '.copy'), [0, start + 0.16, start + 0.79, start + 1.41, start + 2.04]);
      tl.to(rig, { px: 30, lx: 30, duration: tl.duration() }, 0);
    },
  },
  {
    id: 'survival',
    enter: 'panLeft',
    cls: 'beat--stack beat--left',
    // the tree that grows is the 3D hero tree; the track and payouts are SVG
    html: () =>
      copyHTML(S.survival.says) +
      `<div></div><div class="glass" style="justify-self:center;width:min(1100px,100%)">${milestonesSVG()}</div>`,
    build(tl, el, rig) {
      $(el, '.tc-milestones').style.width = '100%';
      const { at } = script(tl, $(el, '.copy'), [0, 0.65, 1.2, 1.75]);
      // months 0..36 and the tree share one progress, timed so month 36 pays out as "40% waits for month 36" lands
      const months = at[3] + 0.1;
      place(tl, milestonesTimeline($(el, '.tc-milestones'), gsap), 0.2, months);
      tl.fromTo(rig, { heroGrowth: 0 }, { heroGrowth: 1, duration: months, ease: 'none' }, 0.2);
      tl.to(rig, { px: 5, pz: 14.5, duration: tl.duration(), ease: 'sine.inOut' }, 0);
    },
  },
  {
    id: 'carbon',
    enter: 'zoomOut',
    cls: 'beat--split',
    // the coin is the 3D carbon particles; the registry serial is SVG
    html: () =>
      copyHTML(S.carbon.says) +
      `<div class="stage-box" style="align-items:flex-end;padding-bottom:12vh"><div class="glass">${O.serialSVG()}</div></div>`,
    build(tl, el, rig) {
      $(el, '.tc-serial').style.width = 'min(440px, 80vw)';
      const { at } = script(tl, $(el, '.copy'), [0, 0.45, 0.95]);
      tl.fromTo(
        rig,
        { carbon: 0 },
        { carbon: 1, duration: at[1] + 0.3, ease: 'power1.inOut' },
        0.1,
      ); // the coin is formed by "one owner"
      place(tl, O.serialTimeline($(el, '.tc-serial'), gsap), at[2] - 0.1, 0.7);
    },
  },
  {
    id: 'roles',
    enter: 'zoomOut',
    cls: 'beat--stack',
    html: () => {
      const { title, items, cta } = S.roles;
      return (
        copyHTML([title]) +
        `<div class="stage-box" style="flex-direction:column;justify-content:center;gap:4vh">` +
        `<div class="glass roles">${items.map(([icon, line]) => `<figure>${iconSVG(icon)}<figcaption>${rich(line)}</figcaption></figure>`).join('')}</div>` +
        `<div style="text-align:center">${copyHTML([{ big: cta.big, size: 'm' }])}<div class="cta"><a class="btn btn--primary" href="/#/campaigns">${cta.primary}</a><a class="btn" href="/#/sign-in?account=planter&returnTo=%2Fapp">${cta.secondary}</a></div></div>` +
        `</div>`
      );
    },
    build(tl, el) {
      el.querySelectorAll('.tc-icon').forEach((s) => (s.style.width = 'clamp(52px, 7vw, 96px)'));
      const [titleCopy, ctaCopy] = el.querySelectorAll('.copy');
      script(tl, titleCopy, [0]);
      el.querySelectorAll('.roles figure').forEach((fig, i) => {
        const caption = $(fig, 'figcaption');
        place(tl, iconTimeline($(fig, '.tc-icon'), gsap), 0.25 + i * 0.14, 0.4);
        tl.from(caption, { autoAlpha: 0, y: 14, duration: 0.1 }, 0.35 + i * 0.14);
        tl.add(drawFx(caption).paused(false), 0.45 + i * 0.14);
      });
      script(tl, ctaCopy, [1.2]);
      tl.from(
        el.querySelectorAll('.btn'),
        { autoAlpha: 0, y: 16, stagger: 0.05, duration: 0.12 },
        1.45,
      );
    },
  },
];

// Camera moves between beats. Incoming beats always settle at scale 1, so text is never upscaled.
const T = 0.95; // camera moves between beats (timeline units)
const ENTER = {
  zoomIn: (tl, out, inn, at) =>
    tl
      .to(out, { scale: 1.7, autoAlpha: 0, duration: T * 0.6, ease: 'power2.in' }, at)
      .fromTo(
        inn,
        { scale: 0.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: T * 0.65, ease: 'power2.out' },
        at + T * 0.35,
      ),
  zoomOut: (tl, out, inn, at) =>
    tl
      .to(out, { scale: 0.6, autoAlpha: 0, duration: T * 0.6, ease: 'power2.in' }, at)
      .fromTo(
        inn,
        { scale: 1.45, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: T * 0.65, ease: 'power2.out' },
        at + T * 0.35,
      ),
  panRight: (tl, out, inn, at) =>
    tl
      .to(out, { xPercent: -100, duration: T, ease: 'power2.inOut' }, at)
      .fromTo(
        inn,
        { xPercent: 100, autoAlpha: 1 },
        { xPercent: 0, duration: T, ease: 'power2.inOut' },
        at,
      ),
  panLeft: (tl, out, inn, at) =>
    tl
      .to(out, { xPercent: 100, duration: T, ease: 'power2.inOut' }, at)
      .fromTo(
        inn,
        { xPercent: -100, autoAlpha: 1 },
        { xPercent: 0, duration: T, ease: 'power2.inOut' },
        at,
      ),
};

// ---------------------------------------------------------------- assemble
document.fonts.ready.then(() => {
  const gl = createStage3D($(stage, '.gl'), { mobile, still: reduce });
  const { rig } = gl;
  Object.assign(rig, pose('hero'));

  // 1. Markup and inner timelines for every beat, measured before any beat is moved or scaled.
  const rail = $(stage, '.rail');
  const beats = BEATS.map((b) => {
    const el = document.createElement('section');
    el.className = `beat ${b.cls}`;
    el.id = b.id;
    el.innerHTML = b.html(); // no ghost words here: the 3D forest already gives the depth, and big words collided with it
    stage.insertBefore(el, rail);
    return { ...b, el };
  });
  // the hook greets on load, before any scroll; the forest grows around the seedling at the same time
  const firstSay = $(beats[0].el, '.hook .say');
  const hello = reduce ? null : greet(firstSay);
  beats.forEach((b) => {
    b.tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    b.build(b.tl, b.el, rig);
  });

  if (reduce) {
    // Reduced motion: no pin, no scrub. Every beat shows its final state as a plain article,
    // every headline visible, marks drawn. The 3D layer is a still backdrop.
    beats.forEach((b) => b.tl.progress(1));
    gsap.set(stage.querySelectorAll('.say, .strip, .beat'), {
      clearProps: 'opacity,visibility,transform',
    });
    Object.assign(rig, pose('roles'), { heroGrowth: 1, dim: 0.65 });
    gl.render();
    return;
  }

  // 2. One master timeline: beat, camera move, beat, camera move...
  gsap.from(rig, { grow: 0, duration: 3.2, ease: 'power2.out', delay: 0.1 });
  gsap.set(beats[0].el, { autoAlpha: 1 });
  const master = gsap.timeline({ defaults: { ease: 'none' } });
  beats.forEach((b, i) => {
    if (i > 0) {
      const at = master.duration();
      ENTER[b.enter](master, beats[i - 1].el, b.el, at);
      master.to(rig, { ...pose(b.id), duration: T, ease: 'power2.inOut' }, at);
    }
    master.addLabel(b.id).add(b.tl.paused(false));
  });
  master.fromTo(rail, { scaleX: 0 }, { scaleX: 1, duration: master.duration() }, 0);

  const st = ScrollTrigger.create({
    animation: master,
    trigger: stage,
    start: 'top top',
    end: () => `+=${innerHeight * master.duration() * (mobile ? 0.95 : 1.15)}`, // scroll per unit: slow enough to read
    pin: true,
    scrub: 0.7,
    invalidateOnRefresh: true,
  });
  ScrollTrigger.refresh();
  hello?.play();

  // ?at=survival,0.5 jumps to a beat at a progress within it (review and screenshots)
  const at = new URLSearchParams(location.search).get('at');
  if (at) {
    const [id, p] = at.split(',');
    const i = beats.findIndex((b) => b.id === id);
    if (i >= 0) {
      const time = master.labels[id] + beats[i].tl.duration() * +p;
      window.scrollTo(0, st.start + (st.end - st.start) * (time / master.duration()));
    }
  }
});

// ponytail: word marks and line masks are measured once, so a real width change reloads the page.
let lastWidth = innerWidth;
addEventListener('resize', () => {
  clearTimeout(window.__reflow);
  window.__reflow = setTimeout(
    () => Math.abs(innerWidth - lastWidth) > 40 && location.reload(),
    300,
  );
});
