import { useCallback, useEffect, useState } from 'react';
import type { NormalizedRect } from '@/types';
import { normalizeSelectedText } from '@/utils/format';

export interface TextSelectionInfo {
  text: string;
  /** Absolute viewport position of the selection — used to anchor the popover. */
  anchorX: number;
  anchorY: number;
  /** Per-line rects in container-relative *normalized* (0..1) coordinates. */
  rectsByPage: Map<number, NormalizedRect[]>;
}

/**
 * Find the page index that a given DOM node belongs to by walking up to the
 * first `[data-page-number]` ancestor. The PdfPage component stamps that
 * attribute on its wrapper.
 */
function pageNumberOf(node: Node | null): number | null {
  let cur: Node | null = node;
  while (cur && cur.nodeType !== 1) cur = cur.parentNode;
  let el = cur as HTMLElement | null;
  while (el) {
    const attr = el.dataset?.pageNumber;
    if (attr) {
      const n = Number(attr);
      return Number.isFinite(n) ? n : null;
    }
    el = el.parentElement;
  }
  return null;
}

/** Convert an absolute DOMRect into a 0..1 normalized rect within `container`. */
function normalize(rect: DOMRect, container: DOMRect): NormalizedRect {
  return {
    x: (rect.left - container.left) / container.width,
    y: (rect.top - container.top) / container.height,
    width: rect.width / container.width,
    height: rect.height / container.height,
  };
}

/**
 * Watch the document selection and surface it as a stable structure.
 *
 * Returns:
 * - `selection` — the current snapshot, or `null` if nothing is selected.
 * - `clear()`   — programmatically clear the underlying selection.
 *
 * Selections that span multiple pages are split per-page so a multi-page
 * highlight is stored as several documents (one per page) for correct
 * rendering when only one page is in view.
 */
export function useTextSelection(): {
  selection: TextSelectionInfo | null;
  clear: () => void;
} {
  const [selection, setSelection] = useState<TextSelectionInfo | null>(null);

  useEffect(() => {
    const handler = () => {
      const sel = document.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const rawText = sel.toString();
      const text = normalizeSelectedText(rawText);
      if (!text) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rectList = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0 && r.height > 0,
      );
      if (rectList.length === 0) {
        setSelection(null);
        return;
      }

      const startPage = pageNumberOf(range.startContainer);
      const endPage = pageNumberOf(range.endContainer);
      if (startPage === null || endPage === null) {
        setSelection(null);
        return;
      }

      const rectsByPage = new Map<number, NormalizedRect[]>();
      for (const rect of rectList) {
        const elAtCenter = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        const page = pageNumberOf(elAtCenter);
        if (page === null) continue;

        const pageEl = (elAtCenter as HTMLElement | null)?.closest<HTMLElement>(
          '[data-page-container]',
        );
        if (!pageEl) continue;

        const containerRect = pageEl.getBoundingClientRect();
        const norm = normalize(rect, containerRect);
        const arr = rectsByPage.get(page) ?? [];
        arr.push(norm);
        rectsByPage.set(page, arr);
      }

      // Anchor popover above the last rect (where the user lifted their finger).
      const last = rectList[rectList.length - 1];
      setSelection({
        text,
        anchorX: last.left + last.width / 2,
        anchorY: last.top,
        rectsByPage,
      });
    };

    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  const clear = useCallback(() => {
    document.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  return { selection, clear };
}
