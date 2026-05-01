import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import BookUploader from '@/components/library/BookUploader';
import { useAuthStore } from '@/store/useAuthStore';
import { _resetNotifierForTests } from '@/services/notifier';
import { renderWithToasts } from '@/test/renderWithToasts';

const uploadBook = vi.fn();
const createBook = vi.fn();
const newBookRef = vi.fn();

vi.mock('@/services/storage', () => ({
  uploadBook: (...args: unknown[]) => uploadBook(...args),
}));

vi.mock('@/services/repository/books', () => ({
  createBook: (...args: unknown[]) => createBook(...args),
  newBookRef: (...args: unknown[]) => newBookRef(...args),
}));

beforeEach(() => {
  _resetNotifierForTests();
  uploadBook.mockReset();
  createBook.mockReset();
  newBookRef.mockReset();
  newBookRef.mockReturnValue({ id: 'b-new' });
  useAuthStore.setState({
    user: { uid: 'u1' } as never,
    profile: null,
    status: 'authenticated',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function selectFile(file: File) {
  const input = document.querySelector('input[type=file]') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

describe('<BookUploader />', () => {
  it('renders the drop zone copy', () => {
    renderWithToasts(<BookUploader />);
    expect(screen.getByText(/Drop a PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/Max 50/i)).toBeInTheDocument();
  });

  it('rejects non-PDF files', async () => {
    renderWithToasts(<BookUploader />);
    selectFile(new File(['x'], 'foo.txt', { type: 'text/plain' }));
    await waitFor(() => {
      expect(screen.getByText(/Unsupported file/i)).toBeInTheDocument();
    });
    expect(uploadBook).not.toHaveBeenCalled();
  });

  it('rejects oversized files', async () => {
    renderWithToasts(<BookUploader />);
    const big = new File([new Uint8Array(60 * 1024 * 1024)], 'big.pdf', {
      type: 'application/pdf',
    });
    selectFile(big);
    await waitFor(() => {
      expect(screen.getByText(/File too large/i)).toBeInTheDocument();
    });
  });

  it('happy-path uploads and creates a book record', async () => {
    uploadBook.mockReturnValue({
      done: Promise.resolve({ downloadUrl: 'http://dl', storagePath: 'p' }),
      cancel: vi.fn(),
    });
    createBook.mockResolvedValue({});
    const onUploaded = vi.fn();
    renderWithToasts(<BookUploader onUploaded={onUploaded} />);
    selectFile(new File(['x'], 'My_Book.pdf', { type: 'application/pdf' }));
    await waitFor(() => {
      expect(uploadBook).toHaveBeenCalled();
      expect(createBook).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ id: 'b-new', title: 'My Book' }),
      );
      expect(onUploaded).toHaveBeenCalledWith('b-new');
    });
    expect(screen.getByText(/Upload complete/i)).toBeInTheDocument();
  });

  it('toasts on upload failure', async () => {
    uploadBook.mockReturnValue({
      done: Promise.reject(new Error('storage offline')),
      cancel: vi.fn(),
    });
    renderWithToasts(<BookUploader />);
    selectFile(new File(['x'], 'b.pdf', { type: 'application/pdf' }));
    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
    });
  });

  it('rejects uploads without a signed-in user', async () => {
    useAuthStore.setState({ user: null });
    renderWithToasts(<BookUploader />);
    selectFile(new File(['x'], 'b.pdf', { type: 'application/pdf' }));
    await waitFor(() => {
      expect(screen.getByText(/Not signed in/i)).toBeInTheDocument();
    });
  });
});
