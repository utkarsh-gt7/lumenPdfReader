import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NotesPage from '@/pages/Notes';
import { useAuthStore } from '@/store/useAuthStore';
import { _resetNotifierForTests } from '@/services/notifier';
import type { Book, Note } from '@/types';

const subscribeToAllNotes = vi.fn();
const subscribeToBooks = vi.fn();
const removeNote = vi.fn();

vi.mock('@/services/repository/notes', async () => {
  // Forward every export by default and only override the two functions
  // we want to spy on. We pass the module path through unknown so the
  // ESLint rule against typeof-import annotations stays happy.
  const actual = (await vi.importActual('@/services/repository/notes')) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    subscribeToAllNotes: (...args: unknown[]) => subscribeToAllNotes(...args),
    removeNote: (...args: unknown[]) => removeNote(...args),
  };
});

vi.mock('@/services/repository/books', () => ({
  subscribeToBooks: (...args: unknown[]) => subscribeToBooks(...args),
}));

beforeEach(() => {
  _resetNotifierForTests();
  subscribeToAllNotes.mockReset();
  subscribeToBooks.mockReset();
  removeNote.mockReset();
  useAuthStore.setState({
    user: { uid: 'u1' } as never,
    profile: null,
    status: 'authenticated',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderNotes() {
  return render(
    <MemoryRouter>
      <NotesPage />
    </MemoryRouter>,
  );
}

const sampleNotes: Note[] = [
  {
    id: 'n1',
    bookId: 'b1',
    page: 3,
    referenceText: 'foo bar',
    body: 'thoughts about foo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'n2',
    bookId: 'b2',
    page: 12,
    referenceText: 'something else',
    body: 'totally different topic',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const sampleBooks: Book[] = [
  {
    id: 'b1',
    title: 'Meditations',
    filename: 'm.pdf',
    storagePath: 'p',
    downloadUrl: 'd',
    totalPages: 100,
    currentPage: 1,
    lastReadAt: 0,
    addedAt: 0,
    sizeBytes: 0,
  },
];

describe('<NotesPage />', () => {
  it('renders a skeleton while loading', () => {
    subscribeToAllNotes.mockImplementation(() => () => undefined);
    subscribeToBooks.mockImplementation(() => () => undefined);
    renderNotes();
    expect(screen.getByText(/Your notes/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no notes', () => {
    subscribeToAllNotes.mockImplementation((_uid, cb) => {
      (cb as (n: Note[]) => void)([]);
      return () => undefined;
    });
    subscribeToBooks.mockImplementation((_uid, cb) => {
      (cb as (b: Book[]) => void)([]);
      return () => undefined;
    });
    renderNotes();
    expect(screen.getByText(/No notes yet/i)).toBeInTheDocument();
  });

  it('renders notes and resolves book titles', () => {
    subscribeToAllNotes.mockImplementation((_uid, cb) => {
      (cb as (n: Note[]) => void)(sampleNotes);
      return () => undefined;
    });
    subscribeToBooks.mockImplementation((_uid, cb) => {
      (cb as (b: Book[]) => void)(sampleBooks);
      return () => undefined;
    });
    renderNotes();
    expect(screen.getByText('Meditations')).toBeInTheDocument();
    expect(screen.getByText(/foo bar/)).toBeInTheDocument();
    expect(screen.getByText(/totally different topic/)).toBeInTheDocument();
  });

  it('filters notes by search term', async () => {
    subscribeToAllNotes.mockImplementation((_uid, cb) => {
      (cb as (n: Note[]) => void)(sampleNotes);
      return () => undefined;
    });
    subscribeToBooks.mockImplementation((_uid, cb) => {
      (cb as (b: Book[]) => void)(sampleBooks);
      return () => undefined;
    });
    const user = userEvent.setup();
    renderNotes();
    await user.type(screen.getByPlaceholderText(/Search notes/i), 'thoughts');
    expect(screen.getByText(/thoughts about foo/)).toBeInTheDocument();
    expect(screen.queryByText(/totally different/)).not.toBeInTheDocument();
  });

  it('shows a no-match empty state when filtered to nothing', async () => {
    subscribeToAllNotes.mockImplementation((_uid, cb) => {
      (cb as (n: Note[]) => void)(sampleNotes);
      return () => undefined;
    });
    subscribeToBooks.mockImplementation(() => () => undefined);
    const user = userEvent.setup();
    renderNotes();
    await user.type(screen.getByPlaceholderText(/Search notes/i), 'zzzzzz');
    expect(screen.getByText(/No notes match that search/i)).toBeInTheDocument();
  });

  it('deletes a note when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    subscribeToAllNotes.mockImplementation((_uid, cb) => {
      (cb as (n: Note[]) => void)([sampleNotes[0]]);
      return () => undefined;
    });
    subscribeToBooks.mockImplementation(() => () => undefined);
    removeNote.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNotes();
    await user.click(screen.getByRole('button', { name: /Delete/i }));
    await waitFor(() => {
      expect(removeNote).toHaveBeenCalledWith('u1', 'b1', 'n1');
    });
  });
});
