import { Art } from '../../../shared/art/art';
import { iconSVG, iconTimeline, type IconName } from '../../../shared/art/icons';
import { pick } from '../../../shared/dom';
import { place } from '../helpers';
import { COPY } from '../landing.copy';
import { LINKS } from '../landing.links';
import type { Beat } from '../types';
import { drawFx } from '../words/marks';
import { Copy, Rich } from '../words/rich';
import { script } from '../words/script';

function Role({ icon, line }: { icon: IconName; line: string }) {
  return (
    <figure>
      <Art markup={iconSVG(icon)} />
      <figcaption>
        <Rich text={line} />
      </figcaption>
    </figure>
  );
}

function RolesContent() {
  const { title, items, cta } = COPY.roles;

  return (
    <>
      <Copy says={[title]} heading="h2" />
      <div
        className="stage-box"
        style={{ flexDirection: 'column', justifyContent: 'center', gap: '4vh' }}
      >
        <div className="glass roles">
          {items.map((item) => (
            <Role key={item.icon} icon={item.icon} line={item.line} />
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Copy says={[{ big: cta.big, size: 'm' }]} />
          <div className="cta">
            <a className="btn btn--primary" href={LINKS.fund}>
              {cta.primary}
            </a>
            <a className="btn" href={LINKS.becomePlanter}>
              {cta.secondary}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

const TIMING = {
  icon: 0.25,
  step: 0.14,
  iconLength: 0.4,
  caption: 0.35,
  mark: 0.45,
  cta: 1.2,
  buttons: 1.45,
};

export const roles: Beat = {
  id: 'roles',
  cls: 'beat--stack',
  enter: 'zoomOut',
  Content: RolesContent,
  build(timeline, root) {
    root.querySelectorAll<SVGElement>('.tc-icon').forEach((icon) => {
      icon.style.width = 'clamp(52px, 7vw, 96px)';
    });
    const [titleCopy, ctaCopy] = root.querySelectorAll('.copy');
    script(timeline, titleCopy, [0]);
    root.querySelectorAll('.roles figure').forEach((figure, index) => {
      const offset = index * TIMING.step;
      const icon = pick<SVGElement>(figure, '.tc-icon');
      place(timeline, iconTimeline(icon), TIMING.icon + offset, TIMING.iconLength);
      timeline.from(
        pick(figure, 'figcaption'),
        { autoAlpha: 0, y: 14, duration: 0.1 },
        TIMING.caption + offset,
      );
      timeline.add(drawFx(pick(figure, 'figcaption')).paused(false), TIMING.mark + offset);
    });
    script(timeline, ctaCopy, [TIMING.cta]);
    timeline.from(
      root.querySelectorAll('.btn'),
      { autoAlpha: 0, y: 16, stagger: 0.05, duration: 0.12 },
      TIMING.buttons,
    );
  },
};
