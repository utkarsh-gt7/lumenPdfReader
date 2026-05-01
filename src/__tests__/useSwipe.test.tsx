import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useSwipe } from '@/hooks/useSwipe';

function dispatchTouch(target: HTMLElement, type: string, x: number, y: number) {
  const touch = { clientX: x, clientY: y, identifier: 0, target } as unknown as Touch;
  const event = new Event(type, { bubbles: true }) as TouchEvent & { touches: TouchList };
  Object.defineProperty(event, 'touches', {
    get: () => (type === 'touchend' ? [] : [touch]),
  });
  Object.defineProperty(event, 'changedTouches', {
    get: () => [touch],
  });
  target.dispatchEvent(event);
}

describe('useSwipe', () => {
  it('fires onSwipeLeft for a leftward swipe', () => {
    const left = vi.fn();
    const right = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useSwipe(ref, left, right);
      return ref;
    });

    dispatchTouch(el, 'touchstart', 200, 100);
    dispatchTouch(el, 'touchend', 50, 110);
    expect(left).toHaveBeenCalledTimes(1);
    expect(right).not.toHaveBeenCalled();

    el.remove();
  });

  it('fires onSwipeRight for a rightward swipe', () => {
    const left = vi.fn();
    const right = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useSwipe(ref, left, right);
      return ref;
    });

    dispatchTouch(el, 'touchstart', 50, 100);
    dispatchTouch(el, 'touchend', 200, 110);
    expect(right).toHaveBeenCalledTimes(1);
    expect(left).not.toHaveBeenCalled();

    el.remove();
  });

  it('ignores short movements below the threshold', () => {
    const left = vi.fn();
    const right = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useSwipe(ref, left, right, { threshold: 100 });
      return ref;
    });

    dispatchTouch(el, 'touchstart', 200, 100);
    dispatchTouch(el, 'touchend', 180, 100);
    expect(left).not.toHaveBeenCalled();
    expect(right).not.toHaveBeenCalled();

    el.remove();
  });

  it('ignores swipes that travel mostly vertically', () => {
    const left = vi.fn();
    const right = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useSwipe(ref, left, right, { maxAngle: 20 });
      return ref;
    });

    dispatchTouch(el, 'touchstart', 100, 50);
    dispatchTouch(el, 'touchend', 30, 400); // mostly down, slight left
    expect(left).not.toHaveBeenCalled();
    expect(right).not.toHaveBeenCalled();

    el.remove();
  });
});
