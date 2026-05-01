import { useEffect } from 'react';

interface PinchZoomOptions {
  /** Scale lower bound. */
  min?: number;
  /** Scale upper bound. */
  max?: number;
}

/**
 * Wire pinch (touch) and Ctrl/Cmd+wheel (desktop) gestures to a zoom
 * setter. Attaches passive listeners to the given target element.
 *
 * Pure ref-based — no React state — so re-renders during the gesture are
 * driven by whatever the consumer's `onZoom` handler does.
 */
export function usePinchZoom(
  targetRef: React.RefObject<HTMLElement | null>,
  getZoom: () => number,
  setZoom: (z: number) => void,
  options: PinchZoomOptions = {},
): void {
  const { min = 0.5, max = 4 } = options;

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    let initialDist = 0;
    let initialZoom = 1;

    const distance = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const clamp = (z: number) => Math.max(min, Math.min(max, z));

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDist = distance(e.touches);
        initialZoom = getZoom();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || initialDist === 0) return;
      const ratio = distance(e.touches) / initialDist;
      e.preventDefault();
      setZoom(clamp(initialZoom * ratio));
    };

    const onTouchEnd = () => {
      initialDist = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      const step = 0.1;
      setZoom(clamp(getZoom() + direction * step));
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, [targetRef, getZoom, setZoom, min, max]);
}
