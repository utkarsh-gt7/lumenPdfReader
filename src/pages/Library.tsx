import { useEffect, useState } from 'react';
import { Library as LibraryIcon } from 'lucide-react';
import BookUploader from '@/components/library/BookUploader';
import BookCard from '@/components/library/BookCard';
import { useAuthStore } from '@/store/useAuthStore';
import { subscribeToBooks, deleteBook } from '@/services/repository/books';
import { deleteBookFile } from '@/services/storage';
import { notify } from '@/services/notifier';
import type { Book } from '@/types';

export default function Library() {
  const uid = useAuthStore((s) => s.user?.uid);
  const profile = useAuthStore((s) => s.profile);
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToBooks(uid, setBooks);
    return unsub;
  }, [uid]);

  const handleDelete = async (book: Book) => {
    if (!uid) return;
    try {
      // Order matters: remove the doc first so the UI stops linking to a
      // non-existent file. Storage cleanup is best-effort — orphans don't
      // hurt anything and Rules will deny non-owners anyway.
      await deleteBook(uid, book.id);
      await deleteBookFile(book.storagePath);
      notify.success('Removed', `"${book.title}" has been deleted.`);
    } catch (err) {
      notify.error('Delete failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">
            {profile?.displayName ? `${profile.displayName}'s library` : 'Your library'}
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            {books === null
              ? 'Loading your shelf…'
              : books.length === 0
                ? 'Empty shelf — upload a PDF to get started.'
                : `${books.length} ${books.length === 1 ? 'book' : 'books'} · synced across all your devices`}
          </p>
        </div>
      </header>

      <BookUploader />

      {books === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="card animate-pulse h-72 bg-ink-100 dark:bg-ink-900 border-transparent"
            />
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((b) => (
            <BookCard key={b.id} book={b} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 text-center">
      <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-royal-100 text-royal-700 dark:bg-royal-900/50 dark:text-royal-300 mb-3">
        <LibraryIcon className="w-5 h-5" />
      </div>
      <h2 className="font-display text-xl">A blank shelf is a fresh start.</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
        Upload a PDF above. Lumen will remember the page you stop on so you can pick up exactly there
        from any of your devices.
      </p>
    </div>
  );
}
