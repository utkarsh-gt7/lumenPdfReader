import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigatorProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (page: number) => void;
}

export default function PageNavigator({
  page,
  totalPages,
  onPrev,
  onNext,
  onJump,
}: PageNavigatorProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/85 text-ink-50 px-1 py-1 backdrop-blur shadow-book">
      <button
        type="button"
        aria-label="Previous page"
        onClick={onPrev}
        disabled={page <= 1}
        className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-40"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-1 px-2 text-sm tabular-nums">
        <input
          type="number"
          min={1}
          max={totalPages || undefined}
          value={page}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 1) onJump(n);
          }}
          className="w-12 bg-transparent text-center font-medium outline-none focus-visible:ring-1 focus-visible:ring-royal-400 rounded"
          aria-label="Current page"
        />
        <span className="text-ink-400">/ {totalPages || '—'}</span>
      </div>
      <button
        type="button"
        aria-label="Next page"
        onClick={onNext}
        disabled={totalPages > 0 && page >= totalPages}
        className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-40"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
