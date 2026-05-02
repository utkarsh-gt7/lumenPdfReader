import { useEffect, useRef } from 'react';
import { BRIGHTNESS_MAX, BRIGHTNESS_MIN } from '@/types';

/** Width of the right-edge zone (px) where vertical drags adjust brightness. */
const EDGE_ZONE_PX = 32;

/** Pixels of vertical drag corresponding to a full brightness sweep. */
const FULL_SWEEP_PX = 280;

/** Per-keystroke brightness delta. */
const KEY_STEP = 0.1;

/** Per-wheel-tick brightness delta when Alt is held. */
const WHEEL_STEP = 0.05;

interface BrightnessGestureOptions {
  /** Reads the current brightness without re-binding on every change. */
  read: () => number;
  /** Receives clamped new brightness values. */
  write: (value: number) => void;
}

const editableSelector =
  'input, textarea, select, [contenteditable=""], [contenteditable=true]';

function clampBrightness(value: number): number {
  if (Number.isNaN(value)) return BRIGHTNESS_MIN;
  if (value < BRIGHTNESS_MIN) return BRIGHTNESS_MIN;
  if (value > BRIGHTNESS_MAX) return BRIGHTNESS_MAX;
  return value;
}

/**
 * Wire global brightness gestures with no extra UI:
 *
 *  - Touch/pen: drag vertically along the right ~32px edge of the
 *    viewport. Drag up = brighter, down = dimmer (mirrors the iOS/Android
 *    side-of-screen brightness idiom users already know).
 *  - Mouse: hold Alt and scroll the wheel — Alt is unbound by default in
 *    every major browser, and reachable on every desktop OS.
 *  - Keyboard: ']' raises and '[' lowers brightness — mirrors editor
 *    conventions, accessible without pointing devices, and never
 *    triggers while focus is in an editable surface.
 *
 * The hook only ever fires `write(next)` with a clamped value; persistence
 * (e.g. Firestore) and the source-of-truth state are the caller's concern.
 */
export function useBrightnessGesture({ read, write }: BrightnessGestureOptions): void {
  const readRef = useRef(read);
  const writeRef = useRef(write);

  // Refresh the refs every render so closures inside the effect see the
  // latest functions without us re-binding listeners.
  useEffect(() => {
    readRef.current = read;
    writeRef.current = write;
  });

  useEffect(() => {
    let dragStartY: number | null = null;
    let dragStartBrightness = 1;

    function setNext(value: number): void {
      writeRef.current(clampBrightness(value));
    }

    function onTouchStart(event: TouchEvent): void {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const fromRightEdge = window.innerWidth - touch.clientX;
      if (fromRightEdge > EDGE_ZONE_PX) return;
      dragStartY = touch.clientY;
      dragStartBrightness = readRef.current();
    }

    function onTouchMove(event: TouchEvent): void {
      if (dragStartY === null || event.touches.length !== 1) return;
      const dy = dragStartY - event.touches[0].clientY;
      setNext(dragStartBrightness + dy / FULL_SWEEP_PX);
    }

    function endDrag(): void {
      dragStartY = null;
    }

    function onWheel(event: WheelEvent): void {
      if (!event.altKey) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      setNext(readRef.current() + direction * WHEEL_STEP);
    }

    function onKey(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      if (target?.matches?.(editableSelector)) return;

      if (event.key === ']') {
        event.preventDefault();
        setNext(readRef.current() + KEY_STEP);
      } else if (event.key === '[') {
        event.preventDefault();
        setNext(readRef.current() - KEY_STEP);
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', endDrag);
      window.removeEventListener('touchcancel', endDrag);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
}
