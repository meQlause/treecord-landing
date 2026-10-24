// The one call to action, "Join Treecord": an SVG rig driven by one GSAP timeline (svg-character-animation).
// A seedling grows at its left edge (stem drawn, two leaves unfolding from their nodes), sways from its root, then
// folds back to grow again; a point of light runs once around the pill; the letters ripple as the leaves open.
// Hover lifts the letters one after another and slides the arrow. Reduced motion shows the grown seedling, still.
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { useEffect, useRef } from 'react';
import { LINKS } from '../landing.links';

gsap.registerPlugin(DrawSVGPlugin, SplitText);

// the pivots of the rig, in the seedling's 24×24 box: the root, and the node each leaf grows from
const ROOT = '12 21';
const LOW_NODE = '12 15';
const HIGH_NODE = '12 11';
// how long the light's segment is, against the outline, and the pill's corner
const TRACER_SHARE = 0.14;
// how far a leaf is turned, in degrees, while it is still folded against the stem
const LEAF_FOLD = 40;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const STROKE = 2.5;

type Parts = {
  sprout: SVGGElement;
  stem: SVGPathElement;
  leaves: [SVGPathElement, SVGPathElement];
  tracer: SVGRectElement;
  arrow: SVGSVGElement;
  chars: Element[];
};

/** The tracer follows the pill whatever its size: the rect is re-measured, its dash set to one short segment. */
function fitTracer(button: HTMLElement, tracer: SVGRectElement): number {
  // the layout size, not getBoundingClientRect: the beat may still be scaled in when this measures
  const { offsetWidth: width, offsetHeight: height } = button;
  const inset = STROKE / 2;

  tracer.setAttribute('x', String(inset));
  tracer.setAttribute('y', String(inset));
  tracer.setAttribute('width', String(Math.max(width - STROKE, 0)));
  tracer.setAttribute('height', String(Math.max(height - STROKE, 0)));
  tracer.setAttribute('rx', String(Math.max(height - STROKE, 0) / 2));

  // a pill's outline: two straight sides and one full circle of the height
  const length = 2 * Math.max(width - height, 0) + Math.PI * Math.max(height - STROKE, 0);

  tracer.style.strokeDasharray = `${length * TRACER_SHARE} ${length}`;

  return length;
}

/** One growth cycle, repeated: grow, ripple, sway, trace, rest, fold. */
function cycle(
  { sprout, stem, leaves, tracer, chars }: Parts,
  outline: () => number,
): gsap.core.Timeline {
  const [low, high] = leaves;

  gsap.set(sprout, { svgOrigin: ROOT });
  gsap.set(low, { svgOrigin: LOW_NODE });
  gsap.set(high, { svgOrigin: HIGH_NODE });

  return (
    gsap
      .timeline({ repeat: -1, repeatDelay: 0.6, defaults: { ease: 'power2.inOut' } })
      .fromTo(stem, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.out' })
      .fromTo(
        [low, high],
        { scale: 0, rotation: (index) => (index === 0 ? LEAF_FOLD : -LEAF_FOLD) },
        { scale: 1, rotation: 0, duration: 0.55, stagger: 0.12, ease: 'back.out(2.2)' },
        '-=0.15',
      )
      .to(
        chars,
        { y: -4, duration: 0.18, stagger: 0.04, yoyo: true, repeat: 1, ease: 'sine.out' },
        '<',
      )
      .to(sprout, { rotation: 6, duration: 0.7, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .fromTo(
        tracer,
        { strokeDashoffset: 0, opacity: 1 },
        { strokeDashoffset: () => -outline(), duration: 1.8, ease: 'power1.inOut' },
        '<',
      )
      // fades as it finishes its lap, not after the sway: a finished dash leaves only its round cap, a stray dot
      .to(tracer, { opacity: 0, duration: 0.3 }, '<1.5')
      .to(
        [high, low],
        { scale: 0, rotation: 0, duration: 0.35, stagger: 0.08, ease: 'power2.in' },
        '+=1.4',
      )
      .to(stem, { drawSVG: '0%', duration: 0.35, ease: 'power2.in' }, '-=0.15')
  );
}

/** Hover and keyboard focus: the letters lift one after another, the arrow slides out and back. */
function hover(button: HTMLElement, { chars, arrow }: Parts): () => void {
  const lift = gsap
    .timeline({ paused: true })
    .to(chars, { y: -3, duration: 0.2, stagger: 0.025, ease: 'power2.out' })
    .to(arrow, { x: 5, duration: 0.3, ease: 'power3.out' }, 0);
  const enter = (): void => void lift.play();
  const leave = (): void => void lift.reverse();
  const events = [
    ['pointerenter', enter],
    ['pointerleave', leave],
    ['focus', enter],
    ['blur', leave],
  ] as const;

  events.forEach(([name, handler]) => button.addEventListener(name, handler));

  return () => {
    events.forEach(([name, handler]) => button.removeEventListener(name, handler));
    lift.kill();
  };
}

function useJoinMotion(button: React.RefObject<HTMLAnchorElement | null>) {
  useEffect(() => {
    const root = button.current;

    // read here, not through shared/motion/env: that module measures the screen on import, and the build renders
    // this component in Node to write the static page
    if (root === null || matchMedia(REDUCED_MOTION).matches) {
      return undefined;
    }

    const split = SplitText.create(root.querySelector('.join-label'), { type: 'chars' });
    const parts: Parts = {
      sprout: root.querySelector('.join-sprout') as SVGGElement,
      stem: root.querySelector('.join-stem') as SVGPathElement,
      leaves: [...root.querySelectorAll<SVGPathElement>('.join-leaf')] as Parts['leaves'],
      tracer: root.querySelector('.join-tracer') as SVGRectElement,
      arrow: root.querySelector('.join-arrow') as SVGSVGElement,
      chars: split.chars,
    };
    let outline = fitTracer(root, parts.tracer);
    const resize = new ResizeObserver(() => {
      outline = fitTracer(root, parts.tracer);
    });
    const timeline = cycle(parts, () => outline);
    // the timeline runs only while the button is on screen
    const seen = new IntersectionObserver(([entry]) =>
      entry?.isIntersecting ? timeline.play() : timeline.pause(),
    );
    const unhover = hover(root, parts);

    resize.observe(root);
    seen.observe(root);

    return () => {
      seen.disconnect();
      resize.disconnect();
      unhover();
      timeline.kill();
      split.revert();
    };
  }, [button]);
}

export function JoinButton({ label }: { label: string }) {
  const button = useRef<HTMLAnchorElement>(null);

  useJoinMotion(button);

  return (
    <a ref={button} className="btn btn--primary btn--join" href={LINKS.join} aria-label={label}>
      <svg className="join-edge" aria-hidden="true">
        <rect className="join-tracer" />
      </svg>
      <svg className="join-seedling" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
        <path className="join-soil" d="M5 21.5c2.5-1.4 11.5-1.4 14 0" />
        <g className="join-sprout">
          <path className="join-stem" d="M12 21c0-3.2-.4-6.6.2-10" />
          <path className="join-leaf" d="M12 15c-1.6-.2-4.6-.8-5.6-3.6 2.6-.5 4.8.7 5.6 3.6z" />
          <path className="join-leaf" d="M12.1 11c.6-2.5 2.8-4.6 6-4.4-.5 2.9-3.2 4.6-6 4.4z" />
        </g>
      </svg>
      <span className="join-label" aria-hidden="true">
        {label}
      </span>
      <svg className="join-arrow" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path d="M4 10h11M11 5l5 5-5 5" />
      </svg>
    </a>
  );
}
