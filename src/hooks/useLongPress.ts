import { useCallback, useEffect, useRef } from 'react';

interface LongPressOptions {
  /** Trigger after this many ms of held-down. Default 500ms. */
  delay?: number;
  /** Allowed jitter in pixels before we consider the press cancelled. Default 8px. */
  moveThreshold?: number;
}

interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
}

/**
 * Detect a long-press gesture and fire `onLongPress` once with the original
 * pointer event. Cancels if the user moves more than `moveThreshold` pixels
 * (so it doesn't fire during a swipe / scroll) or releases early.
 */
export function useLongPress(
  onLongPress: (event: React.PointerEvent) => void,
  options: LongPressOptions = {},
): LongPressHandlers {
  const { delay = 500, moveThreshold = 8 } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
    firedRef.current = false;
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  return {
    onPointerDown: (e) => {
      cancel();
      startRef.current = { x: e.clientX, y: e.clientY };
      firedRef.current = false;
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress(e);
      }, delay);
    },
    onPointerMove: (e) => {
      if (!startRef.current || firedRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (Math.hypot(dx, dy) > moveThreshold) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
