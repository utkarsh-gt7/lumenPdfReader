import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Highlighter,
  NotebookPen,
  Library,
  BookA,
  Maximize,
  Minimize,
  Focus,
} from 'lucide-react';
import { useUIStore, type ReaderDrawer } from '@/store/useUIStore';
import { cn } from '@/utils/cn';

interface ReaderToolbarProps {
  title: string;
  bookmarkCount: number;
  highlightCount: number;
  noteCount: number;
  onBookmarkPage: () => void;
  isCurrentPageBookmarked: boolean;
  /** Whether the page is currently in fullscreen mode. */
  isFullscreen: boolean;
  /** Toggle the Fullscreen API. Disabled silently in unsupported browsers. */
  onToggleFullscreen: () => void;
  /** Whether focus mode is currently active. */
  focusMode: boolean;
  /** Toggle focus mode (mutes toasts + sounds, holds wake lock). */
  onToggleFocusMode: () => void;
  /** Hide the Fullscreen button when the API is unsupported. */
  fullscreenSupported: boolean;
}

export default function ReaderToolbar({
  title,
  bookmarkCount,
  highlightCount,
  noteCount,
  onBookmarkPage,
  isCurrentPageBookmarked,
  isFullscreen,
  onToggleFullscreen,
  focusMode,
  onToggleFocusMode,
  fullscreenSupported,
}: ReaderToolbarProps) {
  const drawer = useUIStore((s) => s.drawer);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);

  const toggle = (next: ReaderDrawer) => {
    if (drawer === next) closeDrawer();
    else openDrawer(next);
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 px-3 h-12
                 bg-ink-950/85 text-ink-50 backdrop-blur border-b border-ink-800"
    >
      <Link
        to="/"
        className="p-1.5 rounded-md hover:bg-white/10"
        aria-label="Back to library"
        title="Back to library"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <div className="hidden sm:flex items-center gap-1 text-ink-300 text-sm min-w-0">
        <Library className="w-3.5 h-3.5 opacity-60" />
        <span className="truncate font-display">{title}</span>
      </div>

      <div className="flex-1" />

      {/* Focus mode quick-toggle. Highlighted while active. */}
      <button
        type="button"
        onClick={onToggleFocusMode}
        aria-pressed={focusMode}
        aria-label={focusMode ? 'Disable focus mode' : 'Enable focus mode'}
        title={
          focusMode
            ? 'Focus mode: on — sounds + toasts muted (Z to toggle)'
            : 'Focus mode (Z) — mutes sounds + non-critical toasts'
        }
        className={cn(
          'p-1.5 rounded-md hover:bg-white/10',
          focusMode && 'bg-amber-500/15 text-amber-300',
        )}
      >
        <Focus className="w-4 h-4" />
      </button>

      {/* Fullscreen toggle. Only shown when the API is available. */}
      {fullscreenSupported && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
          className="p-1.5 rounded-md hover:bg-white/10"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      )}

      <button
        type="button"
        onClick={onBookmarkPage}
        className={cn(
          'p-1.5 rounded-md hover:bg-white/10',
          isCurrentPageBookmarked && 'text-amber-300',
        )}
        aria-label={
          isCurrentPageBookmarked ? 'Page bookmarked' : 'Bookmark this page'
        }
        title="Bookmark this page (B / double-tap)"
      >
        <Bookmark className="w-4 h-4" fill={isCurrentPageBookmarked ? 'currentColor' : 'none'} />
      </button>

      <ToolbarToggle
        active={drawer === 'bookmarks'}
        count={bookmarkCount}
        label="Bookmarks"
        onClick={() => toggle('bookmarks')}
        icon={<Bookmark className="w-4 h-4" />}
      />
      <ToolbarToggle
        active={drawer === 'highlights'}
        count={highlightCount}
        label="Highlights"
        onClick={() => toggle('highlights')}
        icon={<Highlighter className="w-4 h-4" />}
      />
      <ToolbarToggle
        active={drawer === 'notes'}
        count={noteCount}
        label="Notes"
        onClick={() => toggle('notes')}
        icon={<NotebookPen className="w-4 h-4" />}
      />
      <ToolbarToggle
        active={drawer === 'dictionary'}
        count={0}
        label="Dictionary"
        onClick={() => toggle('dictionary')}
        icon={<BookA className="w-4 h-4" />}
      />
    </header>
  );
}

function ToolbarToggle({
  active,
  count,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'relative p-1.5 rounded-md hover:bg-white/10',
        active && 'bg-white/15 text-royal-300',
      )}
    >
      {icon}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-royal-500 text-[10px] font-medium leading-4 text-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
