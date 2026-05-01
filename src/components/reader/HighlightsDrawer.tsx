import { Highlighter, Trash2 } from 'lucide-react';
import Drawer from './Drawer';
import type { Highlight, HighlightColor } from '@/types';
import { HIGHLIGHT_COLORS } from '@/types';
import { cn } from '@/utils/cn';

const SWATCH: Record<HighlightColor, string> = {
  yellow: 'bg-marker-yellow',
  green: 'bg-marker-green',
  blue: 'bg-marker-blue',
  pink: 'bg-marker-pink',
  purple: 'bg-marker-purple',
  orange: 'bg-marker-orange',
};

interface HighlightsDrawerProps {
  open: boolean;
  onClose: () => void;
  highlights: Highlight[];
  onJump: (page: number) => void;
  onRemove: (id: string) => void;
  onChangeColor: (id: string, color: HighlightColor) => void;
}

export default function HighlightsDrawer({
  open,
  onClose,
  highlights,
  onJump,
  onRemove,
  onChangeColor,
}: HighlightsDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Highlights" width="md">
      {highlights.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {highlights.map((h) => (
            <li key={h.id} className="p-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onJump(h.page);
                  onClose();
                }}
                className="block w-full text-left"
              >
                <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Page {h.page}</p>
                <blockquote
                  className={cn(
                    'rounded p-2 text-sm leading-relaxed',
                    SWATCH[h.color],
                    'text-ink-900',
                  )}
                >
                  “{h.text}”
                </blockquote>
              </button>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onChangeColor(h.id, c)}
                      aria-label={`Change to ${c}`}
                      className={cn(
                        'w-5 h-5 rounded-full ring-1 ring-black/10 hover:scale-110 transition-transform',
                        SWATCH[c],
                        h.color === c && 'ring-2 ring-royal-500',
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(h.id)}
                  aria-label="Remove highlight"
                  className="p-1.5 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
      <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="font-medium text-ink-700 dark:text-ink-200">No highlights yet</p>
      <p className="mt-1">Select any text on a page to highlight it in your favorite color.</p>
    </div>
  );
}
