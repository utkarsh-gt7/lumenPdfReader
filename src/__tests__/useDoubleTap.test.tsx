import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDoubleTap } from '@/hooks/useDoubleTap';

function makeEvent(): React.PointerEvent {
  return {} as React.PointerEvent;
}

describe('useDoubleTap', () => {
  it('fires only on the second tap within the window', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDoubleTap(cb, { windowMs: 250 }));

    act(() => {
      result.current.onPointerDown(makeEvent());
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      result.current.onPointerDown(makeEvent());
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not fire on a slow second tap', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDoubleTap(cb, { windowMs: 50 }));

    const realPerf = performance.now;
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    act(() => {
      result.current.onPointerDown(makeEvent());
    });
    now += 200;
    act(() => {
      result.current.onPointerDown(makeEvent());
    });
    expect(cb).not.toHaveBeenCalled();

    performance.now = realPerf;
  });

  it('resets after firing so a third tap does not retrigger', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDoubleTap(cb));

    act(() => {
      result.current.onPointerDown(makeEvent());
      result.current.onPointerDown(makeEvent());
      result.current.onPointerDown(makeEvent());
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
