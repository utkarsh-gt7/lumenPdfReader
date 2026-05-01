import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReaderToolbar from '@/components/reader/ReaderToolbar';
import { useUIStore } from '@/store/useUIStore';

beforeEach(() => {
  useUIStore.setState({ drawer: 'none' });
});

function setup(overrides: Partial<Parameters<typeof ReaderToolbar>[0]> = {}) {
  const props = {
    title: 'Meditations',
    bookmarkCount: 2,
    highlightCount: 5,
    noteCount: 3,
    onBookmarkPage: vi.fn(),
    isCurrentPageBookmarked: false,
    ...overrides,
  };
  render(
    <MemoryRouter>
      <ReaderToolbar {...props} />
    </MemoryRouter>,
  );
  return props;
}

describe('<ReaderToolbar />', () => {
  it('renders the title and a back link', () => {
    setup();
    expect(screen.getByText('Meditations')).toBeInTheDocument();
    expect(screen.getByLabelText(/Back to library/i)).toHaveAttribute('href', '/');
  });

  it('shows badges for non-zero counts', () => {
    setup();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps very large counts at 99+', () => {
    setup({ highlightCount: 250 });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('fires the bookmark handler', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByRole('button', { name: /Bookmark this page/i }));
    expect(props.onBookmarkPage).toHaveBeenCalled();
  });

  it('reflects "already bookmarked" state', () => {
    setup({ isCurrentPageBookmarked: true });
    expect(screen.getByLabelText(/Page bookmarked/i)).toBeInTheDocument();
  });

  it('opens drawers via the toolbar buttons and closes on second click', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /^Bookmarks$/i, pressed: false }));
    expect(useUIStore.getState().drawer).toBe('bookmarks');
    await user.click(screen.getByRole('button', { name: /^Bookmarks$/i, pressed: true }));
    expect(useUIStore.getState().drawer).toBe('none');
  });

  it('switches between drawers', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /^Highlights$/i }));
    expect(useUIStore.getState().drawer).toBe('highlights');
    await user.click(screen.getByRole('button', { name: /^Notes$/i }));
    expect(useUIStore.getState().drawer).toBe('notes');
    await user.click(screen.getByRole('button', { name: /^Dictionary$/i }));
    expect(useUIStore.getState().drawer).toBe('dictionary');
  });
});
