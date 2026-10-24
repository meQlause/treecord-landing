// The eight beats of the story: markup, and build() for everything animated inside each one.
// The camera poses and the moves between beats live in camera.ts; story.ts assembles them.
import { blindFundingSVG, blindFundingTimeline } from '../../shared/art/blind-funding';
import { certificateSVG, certificateTimeline } from '../../shared/art/certificate';
import { fieldCheckSVG, fieldCheckTimeline } from '../../shared/art/field-check';
import { forgottenSVG, forgottenTimeline } from '../../shared/art/forgotten';
import { iconSVG, iconTimeline, type IconName } from '../../shared/art/icons';
import { logoSVG, logoTimeline } from '../../shared/art/logo';
import { milestonesSVG, milestonesTimeline } from '../../shared/art/milestones';
import { PHONE_SCREEN_VIEWBOX, phoneSVG, phoneTimeline } from '../../shared/art/phone';
import { pipelineSVG, pipelineTimeline } from '../../shared/art/pipeline';
import { serialSVG, serialTimeline } from '../../shared/art/serial';
import { shieldSVG, shieldTimeline } from '../../shared/art/shield';
import { STORY } from '../../../../svg-assets/src/story.js';
import { copyHTML, drawFx, rich, script } from '../../../../svg-assets/src/words.js';
import { pick } from '../../shared/dom';
import { place } from './helpers';
import type { Beat } from './types';

const SPLIT = 'beat--split';
const EASE = { sine: 'sine.inOut', power: 'power2.inOut' };
const PROBLEM_ASSETS = ['.tc-forgotten', '.tc-blind', '.tc-certificate'];

const hero: Beat = {
  id: 'hero',
  cls: 'beat--hero',
  enter: null,
  html: () =>
    copyHTML(STORY.hero.hook, 'hook') +
    `<div class="brand"><div class="mark">${logoSVG()}<span class="wordmark">Treecord</span></div>${copyHTML([STORY.hero.tagline], 'tagline')}</div>`,
  build(timeline, root, rig) {
    const timing = { logoLead: 0.05, logoLength: 0.8, wordmark: 0.3, tagline: 0.55 };
    const logo = pick<SVGElement>(root, '.tc-logo');
    logo.style.width = 'clamp(72px, 11vw, 150px)';
    // script() returns when the hook has really been read; the mark assembles only then
    const { end } = script(
      timeline,
      pick(root, '.hook'),
      Object.values({ greeted: null, second: 0.5, third: 1 }),
    );
    place(timeline, logoTimeline(logo), end - timing.logoLead, timing.logoLength);
    timeline.from(
      pick(root, '.wordmark'),
      { autoAlpha: 0, x: -24, duration: 0.25, ease: 'power3.out' },
      end + timing.wordmark,
    );
    script(timeline, pick(root, '.tagline'), [end + timing.tagline]);
    timeline.to(rig, { pz: 21, py: 4.8, duration: timeline.duration(), ease: EASE.sine }, 0);
  },
};

const seedling: Beat = {
  id: 'seedling',
  cls: SPLIT,
  enter: 'zoomIn',
  html: () => `${copyHTML(STORY.seedling.says)}<div></div>`, // the seedling itself is the 3D hero tree
  build(timeline, root, rig) {
    script(timeline, pick(root, '.copy'), Object.values({ first: 0, second: 0.6 }));
    timeline.to(rig, { pz: 3.8, py: 2.2, duration: timeline.duration(), ease: EASE.sine }, 0);
  },
};

const problems: Beat = {
  id: 'problems',
  cls: 'beat--strip',
  enter: 'panRight',
  html: () => {
    const assets = [forgottenSVG(), blindFundingSVG(), certificateSVG()];
    const panels = STORY.problems.panels.map(
      (says: unknown[], index: number) =>
        `<div class="panel">${assets[index]}${copyHTML(says)}</div>`,
    );

    return `<div class="strip">${panels.join('')}</div>`;
  },
  build(timeline, root, rig, motion) {
    const timing = { slide: 0.8, asset: 0.85, firstCue: 0.05, secondCue: 0.5, minPanel: 0.9 };
    const [wilt, blind, cert] = PROBLEM_ASSETS.map((selector) => pick<SVGElement>(root, selector));
    wilt.style.height = '40vh';
    blind.style.height = '30vh';
    cert.style.height = '36vh';
    const strip = pick(root, '.strip');
    const copies = root.querySelectorAll('.copy');
    const assets = [
      forgottenTimeline(wilt),
      blindFundingTimeline(blind),
      certificateTimeline(cert),
    ];
    // each panel plays its asset and both headlines; the strip only slides on once they have been read
    let clock = 0;
    assets.forEach((asset, index) => {
      if (index) {
        timeline.to(
          strip,
          { x: () => (motion ? -index * innerWidth : 0), duration: timing.slide, ease: EASE.power },
          clock,
        );
        clock += timing.slide;
      }
      place(timeline, asset, clock, timing.asset);
      const cues = [clock + timing.firstCue, clock + timing.secondCue];
      clock = Math.max(script(timeline, copies[index], cues).end, clock + timing.minPanel);
    });
    timeline.to(rig, { px: 16, lx: 16, duration: clock }, 0); // the forest drifts behind the strip: parallax
  },
};

const proof: Beat = {
  id: 'proof',
  cls: SPLIT,
  enter: 'zoomIn',
  html: () =>
    copyHTML(STORY.proof.says) +
    `<div class="stage-box">${phoneSVG()}<div style="display:grid;gap:12px;justify-items:center">${fieldCheckSVG()}${shieldSVG()}</div></div>`,
  build(timeline, root, rig) {
    const timing = { field: 0.2, viewbox: 0.35, shield: 0.35, shieldLead: 0.1 };
    const phone = pick<SVGElement>(root, '.tc-phone');
    Object.assign(phone.style, { height: '70vh', aspectRatio: '320 / 600' });
    const field = pick<SVGElement>(root, '.tc-field');
    field.style.width = 'clamp(170px, 24vw, 330px)';
    const shield = pick<SVGElement>(root, '.tc-shield');
    shield.style.width = 'clamp(52px, 6vw, 90px)';
    const { at: cue, end } = script(
      timeline,
      pick(root, '.copy'),
      Object.values({ a: 0, b: 0.4, c: 0.75, d: 1.1 }),
    );
    // the phone records through the first lines, the values lock with "GPS and time", the seal lands with "Rejected"
    place(timeline, phoneTimeline(phone), 0, cue[3]);
    timeline.to(
      phone,
      {
        attr: { viewBox: PHONE_SCREEN_VIEWBOX },
        duration: timing.viewbox,
        ease: EASE.power,
      },
      cue[1],
    );
    place(timeline, fieldCheckTimeline(field), timing.field, cue[2] + timing.field);
    place(timeline, shieldTimeline(shield), cue[3] + timing.shieldLead, timing.shield);
    timeline.to(rig, { pz: 21, duration: end }, 0);
  },
};

const pipeline: Beat = {
  id: 'pipeline',
  cls: 'beat--stack',
  enter: 'panRight',
  html: () => `${copyHTML(STORY.pipeline.says)}<div class="stage-box">${pipelineSVG()}</div>`, // no glass: a 2D beat, the paper backdrop is calm enough
  build(timeline, root, rig, motion) {
    const timing = { start: 0.55, length: 2.4 };
    const steps = { a: 0.16, b: 0.79, c: 1.41, d: 2.04 };
    const svg = pick<SVGElement>(root, '.tc-pipeline');
    // height-bound so the panel always fits its row on short screens (landscape tablets) and never rides up over the words
    // overflow visible: the path is not cropped at the box, it runs on to both screen edges while the camera pans
    if (motion) {
      Object.assign(svg.style, {
        height: 'min(40vh, 38vw)',
        aspectRatio: '800 / 360',
        maxWidth: '100%',
        overflow: 'visible',
      });
    } else {
      svg.style.width = '100%';
    }
    // the proof sets off once "Proof in. Payment out." has been read; each caption lands just before its node lights
    place(timeline, pipelineTimeline(svg), timing.start, timing.length);
    if (motion) {
      timeline.fromTo(
        svg,
        { attr: { viewBox: '0 0 800 360' } },
        { attr: { viewBox: '800 0 800 360' }, duration: timing.length },
        timing.start,
      );
    }
    const cues = [0, ...Object.values(steps).map((step) => timing.start + step)];
    script(timeline, pick(root, '.copy'), cues);
    timeline.to(rig, { px: 30, lx: 30, duration: timeline.duration() }, 0);
  },
};

const survival: Beat = {
  id: 'survival',
  cls: 'beat--stack beat--left',
  enter: 'panLeft',
  // the tree that grows is the 3D hero tree; the track and payouts are SVG
  html: () =>
    `${copyHTML(STORY.survival.says)}<div></div><div class="glass" style="justify-self:center;width:min(1100px,100%)">${milestonesSVG()}</div>`,
  build(timeline, root, rig) {
    const timing = { start: 0.2, lastLead: 0.1 };
    const track = pick<SVGElement>(root, '.tc-milestones');
    track.style.width = '100%';
    const { at: cue } = script(
      timeline,
      pick(root, '.copy'),
      Object.values({ a: 0, b: 0.65, c: 1.2, d: 1.75 }),
    );
    // months 0..36 and the tree share one progress, timed so month 36 pays out as "40% waits for month 36" lands
    const months = cue[3] + timing.lastLead;
    place(timeline, milestonesTimeline(track), timing.start, months);
    timeline.fromTo(
      rig,
      { heroGrowth: 0 },
      { heroGrowth: 1, duration: months, ease: 'none' },
      timing.start,
    );
    timeline.to(rig, { px: 5, pz: 14.5, duration: timeline.duration(), ease: EASE.sine }, 0);
  },
};

const carbon: Beat = {
  id: 'carbon',
  cls: SPLIT,
  enter: 'zoomOut',
  // the coin is the 3D carbon particles; the registry serial is SVG
  html: () =>
    `${copyHTML(STORY.carbon.says)}<div class="stage-box" style="align-items:flex-end;padding-bottom:12vh"><div class="glass">${serialSVG()}</div></div>`,
  build(timeline, root, rig) {
    const timing = { coinStart: 0.1, coinTail: 0.3, serialLead: 0.1, serialLength: 0.7 };
    const serial = pick<SVGElement>(root, '.tc-serial');
    serial.style.width = 'min(440px, 80vw)';
    const { at: cue } = script(
      timeline,
      pick(root, '.copy'),
      Object.values({ a: 0, b: 0.45, c: 0.95 }),
    );
    // the coin is formed by "one owner"
    timeline.fromTo(
      rig,
      { carbon: 0 },
      { carbon: 1, duration: cue[1] + timing.coinTail, ease: 'power1.inOut' },
      timing.coinStart,
    );
    place(timeline, serialTimeline(serial), cue[2] - timing.serialLead, timing.serialLength);
  },
};

const roles: Beat = {
  id: 'roles',
  cls: 'beat--stack',
  enter: 'zoomOut',
  html: () => {
    const { title, items, cta } = STORY.roles;
    const figures = items.map(
      ([icon, line]: string[]) =>
        `<figure>${iconSVG(icon as IconName)}<figcaption>${rich(line)}</figcaption></figure>`,
    );
    const buttons =
      `<a class="btn btn--primary" href="/#/campaigns">${cta.primary}</a>` +
      `<a class="btn" href="/#/sign-in?account=planter&returnTo=%2Fapp">${cta.secondary}</a>`;

    return (
      copyHTML([title]) +
      `<div class="stage-box" style="flex-direction:column;justify-content:center;gap:4vh">` +
      `<div class="glass roles">${figures.join('')}</div>` +
      `<div style="text-align:center">${copyHTML([{ big: cta.big, size: 'm' }])}<div class="cta">${buttons}</div></div>` +
      `</div>`
    );
  },
  build(timeline, root) {
    const timing = {
      icon: 0.25,
      step: 0.14,
      iconLength: 0.4,
      caption: 0.35,
      mark: 0.45,
      cta: 1.2,
      buttons: 1.45,
    };
    root.querySelectorAll<SVGElement>('.tc-icon').forEach((icon) => {
      icon.style.width = 'clamp(52px, 7vw, 96px)';
    });
    const [titleCopy, ctaCopy] = root.querySelectorAll('.copy');
    script(timeline, titleCopy, [0]);
    root.querySelectorAll('.roles figure').forEach((figure, index) => {
      const offset = index * timing.step;
      place(
        timeline,
        iconTimeline(pick<SVGElement>(figure, '.tc-icon')),
        timing.icon + offset,
        timing.iconLength,
      );
      timeline.from(
        pick(figure, 'figcaption'),
        { autoAlpha: 0, y: 14, duration: 0.1 },
        timing.caption + offset,
      );
      timeline.add(drawFx(pick(figure, 'figcaption')).paused(false), timing.mark + offset);
    });
    script(timeline, ctaCopy, [timing.cta]);
    timeline.from(
      root.querySelectorAll('.btn'),
      { autoAlpha: 0, y: 16, stagger: 0.05, duration: 0.12 },
      timing.buttons,
    );
  },
};

export const BEATS: Beat[] = [hero, seedling, problems, proof, pipeline, survival, carbon, roles];
