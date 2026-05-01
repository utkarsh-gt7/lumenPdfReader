import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BookCard from '@/components/library/BookCard';
import type { Book } from '@/types';

const sampleBook: Book = {
  id: 'b1',
  title: 'Meditations',
  filename: 'meditations.pdf',
  storagePath: 'users/u/books/b1.pdf',
  downloadUrl: 'https://example/b1',
  totalPages: 200,
  currentPage: 50,
  lastReadAt: Date.now(),
  addedAt: Date.now(),
  sizeBytes: 2_500_000,
};

function renderCard(props: Partial<Parameters<typeof BookCard>[0]> = {}) {
  const onDelete = props.onDelete ?? vi.fn();
  render(
    <MemoryRouter>
      <BookCard book={props.book ?? sampleBook} onDelete={onDelete} />
    </MemoryRouter>,
  );
  return { onDelete };
}

describe('<BookCard />', () => {
  it('renders the title, page progress, and size', () => {
    renderCard();
    expect(screen.getByText('Meditations')).toBeInTheDocument();
    expect(screen.getByText(/Page 50 of 200/)).toBeInTheDocument();
    expect(screen.getByText('2.4 MB')).toBeInTheDocument();
  });

  it('omits "of N" when the total page count is unknown', () => {
    renderCard({ book: { ...sampleBook, totalPages: 0 } });
    expect(screen.getByText(/Page 50/)).toBeInTheDocument();
    expect(screen.queryByText(/of 0/)).not.toBeInTheDocument();
  });

  it('links to the reader for that book', () => {
    renderCard();
    const link = screen.getByRole('link', { name: /Meditations/i });
    expect(link).toHaveAttribute('href', '/read/b1');
  });

  it('calls onDelete after the user confirms', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    const { onDelete } = renderCard();
    await user.click(screen.getByLabelText(/Delete Meditations/i));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(sampleBook);
  });

  it('does not delete when the user cancels confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    const { onDelete } = renderCard();
    await user.click(screen.getByLabelText(/Delete Meditations/i));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
