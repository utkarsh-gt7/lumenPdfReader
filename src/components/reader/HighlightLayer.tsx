import type { Highlight, HighlightColor } from '@/types';
import { cn } from '@/utils/cn';

const COLOR_STYLES: Record<HighlightColor, string> = {
  yellow: 'bg-marker-yellow',
  green: 'bg-marker-green',
  blue: 'bg-marker-blue',
  pink: 'bg-marker-pink',
  purple: 'bg-marker-purple',
  orange: 'bg-marker-orange',
};

interface HighlightLayerProps {
  highlights: Highlight[];
  /** Pixel dimensions of the rendered page — drives the rect positioning. */
  pageWidth: number;
  pageHeight: number;
  onClickHighlight?: (h: Highlight) => void;
}

/**
 * Absolute-positioned overlay that draws the persisted highlight rects.
 * Coordinates are normalized 0..1 so a single layer works at any zoom.
 */
export default function HighlightLayer({
  highlights,
  pageWidth,
  pageHeight,
  onClickHighlight,
}: HighlightLayerProps) {
  if (pageWidth === 0 || pageHeight === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {highlights.flatMap((h) =>
        h.rects.map((r, i) => (
          <button
            key={`${h.id}-${i}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClickHighlight?.(h);
            }}
            className={cn(
              'highlight-rect',
              COLOR_STYLES[h.color],
              onClickHighlight ? 'pointer-events-auto' : 'pointer-events-none',
            )}
            style={{
              left: `${r.x * 100}%`,
              top: `${r.y * 100}%`,
              width: `${r.width * 100}%`,
              height: `${r.height * 100}%`,
              opacity: 0.42,
            }}
            aria-label={`Highlighted: ${h.text}`}
            tabIndex={onClickHighlight ? 0 : -1}
          />
        )),
      )}
    </div>
  );
}
