import { Bookmark, Trash2 } from 'lucide-react';
import Drawer from './Drawer';
import type { Bookmark as BookmarkType } from '@/types';
import { formatRelativeTime } from '@/utils/format';

interface BookmarksDrawerProps {
  open: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  onJump: (page: number) => void;
  onRemove: (id: string) => void;
}

export default function BookmarksDrawer({
  open,
  onClose,
  bookmarks,
  onJump,
  onRemove,
}: BookmarksDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Bookmarks">
      {bookmarks.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {bookmarks.map((b) => (
            <li key={b.id} className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => {
                  onJump(b.page);
                  onClose();
                }}
                className="flex-1 text-left flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm group-hover:text-royal-600 dark:group-hover:text-royal-400">
                    Page {b.page}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {b.label ?? formatRelativeTime(b.createdAt)}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onRemove(b.id)}
                aria-label={`Remove bookmark on page ${b.page}`}
                className="p-1.5 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

function EmptyState() {
  return (
    <div className="p-6 text-center text-sm text-ink-500 dark:text-ink-400">
      <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="font-medium text-ink-700 dark:text-ink-200">No bookmarks yet</p>
      <p className="mt-1">
        Tap the bookmark icon — or double-tap an empty area on a page — to mark
        where you want to come back to.
      </p>
    </div>
  );
}
