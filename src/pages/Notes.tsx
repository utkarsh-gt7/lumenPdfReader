import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, NotebookPen, BookOpen, Trash2, ExternalLink } from 'lucide-react';
import type { Note, Book } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { searchNotes, subscribeToAllNotes, removeNote } from '@/services/repository/notes';
import { subscribeToBooks } from '@/services/repository/books';
import { formatRelativeTime } from '@/utils/format';
import { notify } from '@/services/notifier';

/**
 * Cross-book notes view. Powered by a `collectionGroup` query so the user
 * gets a single feed of every note they've ever taken.
 */
export default function NotesPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!uid) return;
    const u1 = subscribeToAllNotes(uid, setNotes);
    const u2 = subscribeToBooks(uid, setBooks);
    return () => {
      u1();
      u2();
    };
  }, [uid]);

  const bookTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of books) map.set(b.id, b.title);
    return map;
  }, [books]);

  const filtered = useMemo(() => {
    if (!notes) return null;
    return searchNotes(notes, filter);
  }, [notes, filter]);

  const handleDelete = async (note: Note) => {
    if (!uid) return;
    if (!window.confirm('Delete this note?')) return;
    try {
      await removeNote(uid, note.bookId, note.id);
      notify.success('Note deleted');
    } catch (err) {
      notify.error('Delete failed', err instanceof Error ? err.message : 'Try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="font-display text-3xl">Your notes</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
          Everything you've highlighted with a thought. Search across every book.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search notes…"
          className="input pl-9"
        />
      </div>

      {filtered === null ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasFilter={Boolean(filter.trim())} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((n) => (
            <li key={n.id} className="card p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-2 text-xs text-ink-500 dark:text-ink-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-medium text-ink-700 dark:text-ink-200 truncate">
                    {bookTitleById.get(n.bookId) ?? 'Untitled book'}
                  </span>
                  <span>· Page {n.page}</span>
                </span>
                <span>{formatRelativeTime(n.createdAt)}</span>
              </div>

              <blockquote className="italic text-sm text-ink-600 dark:text-ink-300 border-l-2 border-royal-300 dark:border-royal-700 pl-3">
                “{n.referenceText}”
              </blockquote>

              <p className="text-sm whitespace-pre-wrap">{n.body}</p>

              <div className="flex items-center justify-end gap-1 pt-1">
                <Link
                  to={`/read/${n.bookId}`}
                  className="btn-ghost text-xs px-2 py-1"
                  title="Open in reader"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(n)}
                  className="btn-ghost text-xs px-2 py-1 hover:text-red-600"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-4 h-28 animate-pulse bg-ink-100 dark:bg-ink-900 border-transparent" />
      ))}
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="card p-10 text-center">
      <NotebookPen className="w-8 h-8 mx-auto opacity-40 mb-2" />
      <h2 className="font-display text-xl">
        {hasFilter ? 'No notes match that search.' : 'No notes yet.'}
      </h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
        {hasFilter
          ? 'Try a different keyword or clear the search.'
          : 'Open a book and highlight a line — the notebook icon attaches a note to it.'}
      </p>
    </div>
  );
}
