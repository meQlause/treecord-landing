import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BEATS } from '../../../src/landing/beats';
import { Landing } from '../../../src/landing/Landing';
import { mountStory } from '../../../src/landing/story';

// the story needs WebGL and layout, neither of which jsdom has; this file covers the React skeleton only
vi.mock('../../../src/landing/story', () => ({ mountStory: vi.fn(() => vi.fn()) }));

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
});
