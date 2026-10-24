import type { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { serialSVG, serialTimeline } from '../../../../src/shared/art/serial';
import { mount } from '../../../helpers/timelines';

const tweens = (timeline: gsap.core.Timeline) =>
  timeline.getChildren(true, true, true) as gsap.core.Tween[];

describe('serial', () => {
  const root = mount(serialSVG());

  it('is a decorative 380 x 130 registry tag with a meta line and a serial', () => {
    expect(root.getAttribute('class')).toBe('tc-serial');
    expect(root.getAttribute('viewBox')).toBe('0 0 380 130');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.tag')).toHaveLength(1);
    expect(root.querySelectorAll('.serial')).toHaveLength(1);
    expect(root.textContent).toContain('SRN PPI');
  });

  it('keeps the serial in data-text and shows dots of the same length until it is scrambled in', () => {
    const serial = root.querySelector('.serial');

    expect(serial?.getAttribute('data-text')).toBe('IDN-2026-000123');
    expect(serial?.textContent).toBe('·'.repeat('IDN-2026-000123'.length));
  });

  it('shows whatever meta line and serial it is given', () => {
    const custom = mount(serialSVG({ meta: 'SRN TEST · 1 tCO₂e', serial: 'ABC-2026-000007' }));

    expect(custom.textContent).toContain('SRN TEST · 1 tCO₂e');
    expect(custom.querySelector('.serial')?.getAttribute('data-text')).toBe('ABC-2026-000007');
    expect(custom.querySelector('.serial')?.textContent).toHaveLength('ABC-2026-000007'.length);
  });

  it('draws the same way twice', () => {
    expect(serialSVG()).toBe(serialSVG());
  });

  it('builds a paused timeline of at least 1 that slides the tag in, then scrambles the serial in', () => {
    const built = mount(serialSVG());
    const timeline = serialTimeline(built);
    const slide = tweens(timeline).find((tween) =>
      tween.targets?.().includes(built.querySelector('.tag') as Element),
    );
    const scramble = tweens(timeline).find((tween) => 'scrambleText' in (tween.vars as object));

    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBeGreaterThanOrEqual(1);
    expect(scramble?.targets()).toEqual([built.querySelector('.serial')]);
    expect((scramble?.vars as { scrambleText: { text: string } }).scrambleText.text).toBe(
      'IDN-2026-000123',
    );
    expect(scramble?.startTime()).toBeGreaterThan(slide?.startTime() ?? 99);
  });
});
