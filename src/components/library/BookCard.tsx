import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, BookOpen, Loader2 } from 'lucide-react';
import type { Book } from '@/types';
import { formatBytes, formatRelativeTime, readingProgressPercent } from '@/utils/format';
import { cn } from '@/utils/cn';

interface BookCardProps {
  book: Book;
  onDelete: (book: Book) => Promise<void> | void;
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  const [deleting, setDeleting] = useState(false);
  const progress = readingProgressPercent(book.currentPage, book.totalPages);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    if (!window.confirm(`Delete "${book.title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await onDelete(book);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Link
      to={`/read/${book.id}`}
      className={cn(
        'group card overflow-hidden transition-transform duration-150',
        'hover:-translate-y-0.5 hover:shadow-glow-royal/40 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-royal-500',
      )}
    >
      <div className="aspect-[3/4] bg-hero-library text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-paper-grain opacity-30 [background-size:18px_18px]" />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <BookOpen className="w-7 h-7 mb-2 opacity-80" />
          <h3 className="font-display text-lg leading-tight line-clamp-3">{book.title}</h3>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex justify-between items-baseline gap-2 text-xs text-ink-500 dark:text-ink-400">
          <span>
            Page {book.currentPage}
            {book.totalPages > 0 ? ` of ${book.totalPages}` : ''}
          </span>
          <span>{formatRelativeTime(book.lastReadAt)}</span>
        </div>

        <div className="h-1 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
          <div
            className="h-full bg-royal-500 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-ink-400 dark:text-ink-500">
          <span>{formatBytes(book.sizeBytes)}</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Delete ${book.title}`}
            className={cn(
              'p-1 rounded text-ink-400 hover:text-red-600 hover:bg-red-50',
              'dark:hover:bg-red-950/40',
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              'transition-opacity',
            )}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
}
