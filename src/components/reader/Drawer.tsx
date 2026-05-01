import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Side-panel width on desktop. Mobile is always full-width bottom sheet. */
  width?: 'sm' | 'md';
}

/**
 * Generic side drawer used by Bookmarks / Highlights / Notes / Dictionary.
 *
 * - Desktop: slides in from the right.
 * - Mobile: slides up from the bottom (more thumb-friendly).
 */
export default function Drawer({ open, onClose, title, children, width = 'sm' }: DrawerProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        className={cn(
          'fixed z-40 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-book',
          'flex flex-col',
          // Mobile: bottom sheet
          'left-0 right-0 bottom-0 rounded-t-2xl max-h-[80vh]',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
          // Desktop: right side panel
          'sm:left-auto sm:bottom-0 sm:top-12 sm:rounded-none sm:max-h-none',
          width === 'sm' ? 'sm:w-80' : 'sm:w-96',
          open ? 'sm:translate-x-0' : 'sm:translate-x-full sm:translate-y-0',
        )}
      >
        <header className="flex items-center justify-between px-4 h-12 border-b border-ink-100 dark:border-ink-800 flex-shrink-0">
          <h2 className="font-display text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}
