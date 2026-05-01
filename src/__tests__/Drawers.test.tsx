import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Drawer from '@/components/reader/Drawer';
import BookmarksDrawer from '@/components/reader/BookmarksDrawer';
import HighlightsDrawer from '@/components/reader/HighlightsDrawer';
import NotesDrawer from '@/components/reader/NotesDrawer';
import type { Bookmark, Highlight, Note } from '@/types';

describe('<Drawer />', () => {
  it('renders content when open and is dismissable', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Drawer open onClose={onClose} title="Test">
        <p>contents</p>
      </Drawer>,
    );
    expect(screen.getByText('contents')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Close drawer/i));
    expect(onClose).toHaveBeenCalled();
  });

  it('honors aria-hidden when closed', () => {
    render(
      <Drawer open={false} onClose={vi.fn()} title="Closed">
        <p>contents</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses a wider md width when requested', () => {
    render(
      <Drawer open onClose={vi.fn()} title="Wide" width="md">
        <p>contents</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toHaveClass(/sm:w-96/);
  });

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Drawer open onClose={onClose} title="X">
        <p>contents</p>
      </Drawer>,
    );
    const backdrop = container.querySelector('div[aria-hidden]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});

const sampleBookmarks: Bookmark[] = [
  { id: 'k1', bookId: 'b1', page: 5, label: 'Chapter 1', createdAt: 0 },
  { id: 'k2', bookId: 'b1', page: 12, createdAt: 1 },
];

describe('<BookmarksDrawer />', () => {
  it('renders empty state', () => {
    render(<BookmarksDrawer open onClose={vi.fn()} bookmarks={[]} onJump={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText(/No bookmarks yet/i)).toBeInTheDocument();
  });

  it('lists bookmarks and handles jump / remove', async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    const onRemove = vi.fn();
    render(
      <BookmarksDrawer
        open
        onClose={vi.fn()}
        bookmarks={sampleBookmarks}
        onJump={onJump}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('Page 5')).toBeInTheDocument();
    expect(screen.getByText('Page 12')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();

    await user.click(screen.getByText('Page 5'));
    expect(onJump).toHaveBeenCalledWith(5);

    await user.click(screen.getByLabelText(/Remove bookmark on page 12/i));
    expect(onRemove).toHaveBeenCalledWith('k2');
  });
});

const sampleHighlights: Highlight[] = [
  {
    id: 'h1',
    bookId: 'b1',
    page: 1,
    text: 'wisdom',
    color: 'yellow',
    rects: [{ x: 0, y: 0, width: 0.5, height: 0.05 }],
    createdAt: 0,
  },
];

describe('<HighlightsDrawer />', () => {
  it('shows empty-state copy', () => {
    render(
      <HighlightsDrawer
        open
        onClose={vi.fn()}
        highlights={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
        onChangeColor={vi.fn()}
      />,
    );
    expect(screen.getByText(/No highlights yet/i)).toBeInTheDocument();
  });

  it('lists highlights with color-change and remove handlers', async () => {
    const user = userEvent.setup();
    const onChangeColor = vi.fn();
    const onRemove = vi.fn();
    const onJump = vi.fn();
    render(
      <HighlightsDrawer
        open
        onClose={vi.fn()}
        highlights={sampleHighlights}
        onJump={onJump}
        onRemove={onRemove}
        onChangeColor={onChangeColor}
      />,
    );
    expect(screen.getByText(/wisdom/)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Change to blue/i));
    expect(onChangeColor).toHaveBeenCalledWith('h1', 'blue');

    await user.click(screen.getByLabelText(/Remove highlight/i));
    expect(onRemove).toHaveBeenCalledWith('h1');
  });
});

const sampleNotes: Note[] = [
  {
    id: 'n1',
    bookId: 'b1',
    page: 3,
    referenceText: 'foo',
    body: 'bar',
    createdAt: 0,
    updatedAt: 0,
  },
];

describe('<NotesDrawer />', () => {
  it('renders empty state', () => {
    render(
      <NotesDrawer
        open
        onClose={vi.fn()}
        notes={[]}
        onJump={vi.fn()}
        onRemove={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText(/No notes for this book/i)).toBeInTheDocument();
  });

  it('switches to edit mode and saves an updated body', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <NotesDrawer
        open
        onClose={vi.fn()}
        notes={sampleNotes}
        onJump={vi.fn()}
        onRemove={vi.fn()}
        onSave={onSave}
      />,
    );
    await user.click(screen.getByLabelText(/Edit note/i));
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'updated body');
    await user.click(screen.getByRole('button', { name: /Save/i }));
    expect(onSave).toHaveBeenCalledWith('n1', 'updated body');
  });

  it('cancel exits edit mode without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <NotesDrawer
        open
        onClose={vi.fn()}
        notes={sampleNotes}
        onJump={vi.fn()}
        onRemove={vi.fn()}
        onSave={onSave}
      />,
    );
    await user.click(screen.getByLabelText(/Edit note/i));
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('removes a note', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <NotesDrawer
        open
        onClose={vi.fn()}
        notes={sampleNotes}
        onJump={vi.fn()}
        onRemove={onRemove}
        onSave={vi.fn()}
      />,
    );
    await user.click(screen.getByLabelText(/Remove note/i));
    expect(onRemove).toHaveBeenCalledWith('n1');
  });
});
