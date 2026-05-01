import { useCallback, useRef } from 'react';

interface DoubleTapOptions {
  /** Maximum ms between two taps to count as a double-tap. */
  windowMs?: number;
}

/**
 * Detect a double-tap (or double-click). Returns a single onPointerDown
 * handler — we deliberately avoid React's `onDoubleClick` because that
 * doesn't fire on touch devices.
 */
export function useDoubleTap(
  onDoubleTap: (event: React.PointerEvent) => void,
  options: DoubleTapOptions = {},
): { onPointerDown: (e: React.PointerEvent) => void } {
  const { windowMs = 300 } = options;
  const lastRef = useRef<number>(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const now = performance.now();
      if (now - lastRef.current <= windowMs) {
        lastRef.current = 0;
        onDoubleTap(e);
        return;
      }
      lastRef.current = now;
    },
    [onDoubleTap, windowMs],
  );

  return { onPointerDown };
}
