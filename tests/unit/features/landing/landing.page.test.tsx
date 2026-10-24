import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BEATS } from '../../../../src/features/landing/beats';
import { COPY } from '../../../../src/features/landing/landing.copy';
import { Landing } from '../../../../src/features/landing/landing.page';
import { mountStory } from '../../../../src/features/landing/story';

// the story needs WebGL and layout, neither of which jsdom has; this file covers the React skeleton only
vi.mock('../../../../src/features/landing/story', () => ({ mountStory: vi.fn(() => vi.fn()) }));

describe('Landing', () => {
  it('renders the skip link, one section per beat and the footer', () => {
    const { container } = render(<Landing />);

    expect(screen.getByRole('link', { name: /skip/i }).getAttribute('href')).toBe('#end');
    expect(BEATS.every((beat) => container.querySelector(`section#${beat.id}`))).toBe(true);
    expect(screen.getByRole('contentinfo').id).toBe('end');
  });

  it('mounts the story once the fonts are ready, on the stage, the 3D host and the rail', async () => {
    const { container } = render(<Landing />);

    await waitFor(() => expect(mountStory).toHaveBeenCalled());

    expect(mountStory).toHaveBeenLastCalledWith({
      stage: container.querySelector('#stage'),
      host: container.querySelector('.gl'),
      rail: container.querySelector('.rail'),
    });
  });

  it('tears the story down on unmount', async () => {
    const teardown = vi.fn();
    vi.mocked(mountStory).mockReturnValueOnce(teardown);
    const { unmount } = render(<Landing />);
    await waitFor(() => expect(mountStory).toHaveBeenCalled());

    unmount();

    expect(teardown).toHaveBeenCalledOnce();
  });

  it('builds the story once under StrictMode, which mounts, unmounts and mounts again', async () => {
    vi.mocked(mountStory).mockClear();
    const teardown = vi.fn();
    vi.mocked(mountStory).mockReturnValue(teardown);

    const { unmount } = render(
      <StrictMode>
        <Landing />
      </StrictMode>,
    );
    await waitFor(() => expect(mountStory).toHaveBeenCalled());

    expect(mountStory).toHaveBeenCalledTimes(1);
    unmount();
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('holds no raw HTML: the beats are components and the art is mounted as parsed SVG', () => {
    const { container } = render(<Landing />);

    expect(container.querySelectorAll('section.beat')).toHaveLength(BEATS.length);
    expect(container.querySelectorAll('section.beat svg').length).toBeGreaterThan(0);
  });

  it('takes the skip link, the stage label, the wordmark and the footer from the copy file', () => {
    const { container } = render(<Landing />);

    expect(screen.getByRole('link', { name: COPY.shell.skip })).not.toBeNull();
    expect(container.querySelector('#stage')?.getAttribute('aria-label')).toBe(COPY.shell.label);
    expect(container.querySelector('.wordmark')?.textContent).toBe(COPY.shell.name);
    expect(screen.getByRole('contentinfo').textContent).toBe(COPY.shell.name + COPY.shell.footer);
  });
});
