import { Minus, Plus, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-ink-900/85 text-ink-50 px-1 py-1 backdrop-blur shadow-book">
      <button
        type="button"
        aria-label="Zoom out"
        onClick={onZoomOut}
        className="p-1.5 rounded-full hover:bg-white/10"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="px-2 text-xs tabular-nums hover:bg-white/10 rounded-full min-w-[3.25rem]"
        aria-label="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={onZoomIn}
        className="p-1.5 rounded-full hover:bg-white/10"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        type="button"
        aria-label="Fit to width"
        onClick={onReset}
        className="p-1.5 rounded-full hover:bg-white/10 hidden sm:inline-flex"
        title="Fit to width"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
