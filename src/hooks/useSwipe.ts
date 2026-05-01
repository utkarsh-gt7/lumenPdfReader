import { useEffect } from 'react';

interface SwipeOptions {
  /** Pixels of horizontal travel required to trigger a swipe. Default 60. */
  threshold?: number;
  /** Skip the swipe if the angle vs. horizontal exceeds this many degrees. */
  maxAngle?: number;
}

/**
 * Listen for left/right swipe gestures on a target element. Used in the
 * reader for tap-to-turn-page on touch devices.
 */
export function useSwipe(
  targetRef: React.RefObject<HTMLElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  options: SwipeOptions = {},
): void {
  const { threshold = 60, maxAngle = 30 } = options;

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let active = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        active = false;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      active = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const angle = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
      if (Math.abs(dx) < threshold) return;
      if (angle > maxAngle) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [targetRef, onSwipeLeft, onSwipeRight, threshold, maxAngle]);
}
