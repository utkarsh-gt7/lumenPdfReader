import { NotebookPen, BookA, X } from 'lucide-react';
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/types';
import { cn } from '@/utils/cn';

const COLOR_STYLES: Record<HighlightColor, string> = {
  yellow: 'bg-marker-yellow',
  green: 'bg-marker-green',
  blue: 'bg-marker-blue',
  pink: 'bg-marker-pink',
  purple: 'bg-marker-purple',
  orange: 'bg-marker-orange',
};

interface SelectionPopoverProps {
  /** Anchor coordinates in viewport space. */
  x: number;
  y: number;
  /** True when the selection is a single word — enables the dictionary action. */
  canLookup: boolean;
  onHighlight: (color: HighlightColor) => void;
  onNote: () => void;
  onLookup: () => void;
  onClose: () => void;
}

/**
 * Floating action menu rendered above the user's selection. Anchored in
 * fixed coordinates so it doesn't get clipped by overflow:hidden parents.
 */
export default function SelectionPopover({
  x,
  y,
  canLookup,
  onHighlight,
  onNote,
  onLookup,
  onClose,
}: SelectionPopoverProps) {
  return (
    <div
      role="menu"
      aria-label="Selection actions"
      className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 animate-pop-in"
      style={{ left: x, top: y - 8 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5 rounded-full bg-ink-900 text-ink-50 shadow-book px-1.5 py-1.5">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Highlight ${color}`}
            onClick={() => onHighlight(color)}
            className={cn(
              'w-7 h-7 rounded-full ring-1 ring-white/20 hover:scale-110 transition-transform',
              COLOR_STYLES[color],
            )}
          />
        ))}
        <span className="w-px h-5 bg-white/20 mx-1" />
        <button
          type="button"
          aria-label="Add note"
          onClick={onNote}
          className="p-1.5 rounded-full hover:bg-white/10"
        >
          <NotebookPen className="w-4 h-4" />
        </button>
        {canLookup && (
          <button
            type="button"
            aria-label="Look up in dictionary"
            onClick={onLookup}
            className="p-1.5 rounded-full hover:bg-white/10"
          >
            <BookA className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
