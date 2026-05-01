import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { usePinchZoom } from '@/hooks/usePinchZoom';

function makeTouches(positions: { x: number; y: number }[]): Touch[] {
  return positions.map((p, i) => ({
    clientX: p.x,
    clientY: p.y,
    identifier: i,
  })) as unknown as Touch[];
}

function dispatch(target: HTMLElement, type: string, touches: Touch[]) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
  Object.defineProperty(event, 'touches', { get: () => touches });
  target.dispatchEvent(event);
  return event;
}

describe('usePinchZoom', () => {
  it('updates zoom proportionally to the change in finger distance', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    let zoom = 1;
    const setZoom = vi.fn((z: number) => {
      zoom = z;
    });
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      usePinchZoom(ref, () => zoom, setZoom);
      return ref;
    });

    dispatch(el, 'touchstart', makeTouches([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]));
    dispatch(el, 'touchmove', makeTouches([
      { x: 0, y: 0 },
      { x: 200, y: 0 },
    ]));
    expect(setZoom).toHaveBeenCalled();
    expect(zoom).toBeCloseTo(2);

    el.remove();
  });

  it('clamps zoom to the configured min/max', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    let zoom = 1;
    const setZoom = vi.fn((z: number) => {
      zoom = z;
    });
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      usePinchZoom(ref, () => zoom, setZoom, { min: 0.8, max: 1.5 });
      return ref;
    });

    dispatch(el, 'touchstart', makeTouches([{ x: 0, y: 0 }, { x: 100, y: 0 }]));
    dispatch(el, 'touchmove', makeTouches([{ x: 0, y: 0 }, { x: 1000, y: 0 }]));
    expect(zoom).toBe(1.5);

    dispatch(el, 'touchend', []);

    dispatch(el, 'touchstart', makeTouches([{ x: 0, y: 0 }, { x: 100, y: 0 }]));
    dispatch(el, 'touchmove', makeTouches([{ x: 0, y: 0 }, { x: 10, y: 0 }]));
    expect(zoom).toBe(0.8);

    el.remove();
  });

  it('zooms in on Ctrl/Cmd + wheel up', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    let zoom = 1;
    const setZoom = vi.fn((z: number) => {
      zoom = z;
    });
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      usePinchZoom(ref, () => zoom, setZoom);
      return ref;
    });

    el.dispatchEvent(new WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true }));
    expect(zoom).toBeCloseTo(1.1);

    el.dispatchEvent(new WheelEvent('wheel', { ctrlKey: true, deltaY: 100, bubbles: true, cancelable: true }));
    expect(zoom).toBeCloseTo(1.0);

    el.remove();
  });

  it('ignores wheel events without a modifier', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const setZoom = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      usePinchZoom(ref, () => 1, setZoom);
      return ref;
    });
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    expect(setZoom).not.toHaveBeenCalled();
    el.remove();
  });
});
