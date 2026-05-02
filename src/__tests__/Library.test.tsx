import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Library from '@/pages/Library';
import { useAuthStore } from '@/store/useAuthStore';
import { _resetNotifierForTests } from '@/services/notifier';
import { renderWithToasts } from '@/test/renderWithToasts';
import type { Book } from '@/types';

const subscribeToBooks = vi.fn();
const deleteBook = vi.fn();
const deleteBookFile = vi.fn();

vi.mock('@/services/repository/books', () => ({
  subscribeToBooks: (...args: unknown[]) => subscribeToBooks(...args),
  deleteBook: (...args: unknown[]) => deleteBook(...args),
}));

vi.mock('@/services/storage', () => ({
  deleteBookFile: (...args: unknown[]) => deleteBookFile(...args),
  uploadBook: vi.fn(),
}));

vi.mock('@/components/library/BookUploader', () => ({
  default: () => <div data-testid="uploader" />,
}));

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'b1',
    title: 'Meditations',
    filename: 'm.pdf',
    storagePath: 'p',
    downloadUrl: 'd',
    totalPages: 100,
    currentPage: 1,
    lastReadAt: Date.now(),
    addedAt: Date.now(),
    sizeBytes: 100,
    ...overrides,
  };
}

beforeEach(() => {
  _resetNotifierForTests();
  subscribeToBooks.mockReset();
  deleteBook.mockReset();
  deleteBookFile.mockReset();
  useAuthStore.setState({
    user: { uid: 'u1' } as never,
    profile: {
      uid: 'u1',
      email: 'a@b.c',
      displayName: 'Aria',
      photoURL: null,
      createdAt: 0,
      onboardingShownFor: [],
      settings: {
        theme: 'dark',
        brightness: 1,
        focusMode: false,
        fontFamily: 'serif',
        fontScale: 1,
      },
    },
    status: 'authenticated',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderLibrary() {
  return renderWithToasts(
    <MemoryRouter>
      <Library />
    </MemoryRouter>,
  );
}

describe('<Library />', () => {
  it('shows a loading skeleton while books are pending', () => {
    subscribeToBooks.mockImplementation(() => () => undefined);
    renderLibrary();
    expect(screen.getByText(/Loading your shelf/i)).toBeInTheDocument();
  });

  it('shows the empty state when the shelf is empty', () => {
    subscribeToBooks.mockImplementation((_uid, cb) => {
      (cb as (b: Book[]) => void)([]);
      return () => undefined;
    });
    renderLibrary();
    expect(screen.getByText(/A blank shelf is a fresh start/i)).toBeInTheDocument();
  });

  it("renders the user's books with personalized header copy", () => {
    subscribeToBooks.mockImplementation((_uid, cb) => {
      (cb as (b: Book[]) => void)([makeBook(), makeBook({ id: 'b2', title: 'Republic' })]);
      return () => undefined;
    });
    renderLibrary();
    expect(screen.getByText("Aria's library")).toBeInTheDocument();
    expect(screen.getByText('Meditations')).toBeInTheDocument();
    expect(screen.getByText('Republic')).toBeInTheDocument();
    expect(screen.getByText(/2 books/)).toBeInTheDocument();
  });

  it('deletes a book when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    subscribeToBooks.mockImplementation((_uid, cb) => {
      (cb as (b: Book[]) => void)([makeBook()]);
      return () => undefined;
    });
    deleteBook.mockResolvedValue(undefined);
    deleteBookFile.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderLibrary();
    await user.click(screen.getByLabelText(/Delete Meditations/i));
    await waitFor(() => {
      expect(deleteBook).toHaveBeenCalledWith('u1', 'b1');
      expect(deleteBookFile).toHaveBeenCalled();
    });
  });

  it('toasts on delete failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    subscribeToBooks.mockImplementation((_uid, cb) => {
      (cb as (b: Book[]) => void)([makeBook()]);
      return () => undefined;
    });
    deleteBook.mockRejectedValue(new Error('forbidden'));

    const user = userEvent.setup();
    renderLibrary();
    await user.click(screen.getByLabelText(/Delete Meditations/i));
    await waitFor(() => {
      expect(screen.getByText(/Delete failed/i)).toBeInTheDocument();
    });
  });
});
