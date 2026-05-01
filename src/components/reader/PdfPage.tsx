import { useState } from 'react';
import { Page } from 'react-pdf';
import type { Highlight, HighlightColor } from '@/types';
import HighlightLayer from './HighlightLayer';

interface PdfPageProps {
  pageNumber: number;
  width: number;
  scale: number;
  highlights: Highlight[];
  onChangeHighlightColor: (highlightId: string, color: HighlightColor) => void;
  onPageDoubleTap?: () => void;
}

/**
 * A single rendered PDF page with the persisted highlight overlay on top.
 *
 * The wrapper is stamped with `data-page-container` and `data-page-number`
 * so the global text-selection hook can attribute selection rectangles to
 * the correct page (selections may legitimately span pages).
 */
export default function PdfPage({
  pageNumber,
  width,
  scale,
  highlights,
  onChangeHighlightColor,
  onPageDoubleTap,
}: PdfPageProps) {
  // Captured once the page reports its rendered viewport.
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Track double-tap manually to support both touch and mouse without relying
  // on the unreliable React onDoubleClick on touch devices.
  const [lastTap, setLastTap] = useState(0);
  const handleClick = () => {
    const now = performance.now();
    if (now - lastTap < 320) {
      setLastTap(0);
      onPageDoubleTap?.();
      return;
    }
    setLastTap(now);
  };

  return (
    <div
      data-page-container
      data-page-number={pageNumber}
      className="relative inline-block"
      onClick={handleClick}
    >
      <Page
        pageNumber={pageNumber}
        width={width}
        scale={scale}
        renderAnnotationLayer={false}
        renderTextLayer
        onRenderSuccess={(p) => {
          // The viewport reflects current scale; we use width/height for the
          // highlight overlay positioning.
          setPageSize({ width: p.width, height: p.height });
        }}
        loading={<PageSkeleton width={width * scale} />}
      />
      <HighlightLayer
        highlights={highlights}
        pageWidth={pageSize.width}
        pageHeight={pageSize.height}
        onClickHighlight={(h) => {
          // Click on an existing highlight cycles through colors as a quick
          // way to change emphasis without opening the drawer.
          const colors: HighlightColor[] = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'];
          const next = colors[(colors.indexOf(h.color) + 1) % colors.length];
          onChangeHighlightColor(h.id, next);
        }}
      />
    </div>
  );
}

function PageSkeleton({ width }: { width: number }) {
  return (
    <div
      className="rounded-md bg-ink-100 dark:bg-ink-900 animate-pulse"
      style={{ width, aspectRatio: '0.7726', minHeight: 200 }}
    />
  );
}
