import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLongPress } from '@/hooks/useLongPress';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function makeEvent(overrides: { clientX?: number; clientY?: number } = {}): React.PointerEvent {
  return {
    clientX: overrides.clientX ?? 100,
    clientY: overrides.clientY ?? 200,
  } as React.PointerEvent;
}

describe('useLongPress', () => {
  it('fires the callback after the configured delay', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, { delay: 400 }));

    act(() => {
      result.current.onPointerDown(makeEvent());
      vi.advanceTimersByTime(399);
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not fire if released early', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, { delay: 500 }));

    act(() => {
      result.current.onPointerDown(makeEvent());
      vi.advanceTimersByTime(200);
      result.current.onPointerUp(makeEvent());
      vi.advanceTimersByTime(500);
    });
    expect(cb).not.toHaveBeenCalled();
  });

  it('cancels when the pointer moves beyond the threshold', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, { delay: 500, moveThreshold: 5 }));

    act(() => {
      result.current.onPointerDown(makeEvent({ clientX: 0, clientY: 0 }));
      result.current.onPointerMove(makeEvent({ clientX: 50, clientY: 50 }));
      vi.advanceTimersByTime(500);
    });
    expect(cb).not.toHaveBeenCalled();
  });

  it('tolerates jitter within the threshold', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, { delay: 300, moveThreshold: 10 }));

    act(() => {
      result.current.onPointerDown(makeEvent({ clientX: 0, clientY: 0 }));
      result.current.onPointerMove(makeEvent({ clientX: 3, clientY: 3 }));
      vi.advanceTimersByTime(300);
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('cancels on pointer leave / cancel', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, { delay: 300 }));

    act(() => {
      result.current.onPointerDown(makeEvent());
      result.current.onPointerLeave();
      vi.advanceTimersByTime(300);
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      result.current.onPointerDown(makeEvent());
      result.current.onPointerCancel();
      vi.advanceTimersByTime(300);
    });
    expect(cb).not.toHaveBeenCalled();
  });
});
