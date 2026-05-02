import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusMode } from '@/hooks/useFocusMode';

interface FakeSentinel {
  release: ReturnType<typeof vi.fn>;
  released: boolean;
}

let request: ReturnType<typeof vi.fn> | null = null;
let sentinel: FakeSentinel | null = null;

function installWakeLock() {
  sentinel = { release: vi.fn(async () => undefined), released: false };
  request = vi.fn(async () => sentinel as unknown);
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request },
  });
}

function uninstallWakeLock() {
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: undefined,
  });
}

beforeEach(() => {
  installWakeLock();
});

afterEach(() => {
  uninstallWakeLock();
  document.documentElement.removeAttribute('data-focus-mode');
  document.body.innerHTML = '';
});

describe('useFocusMode', () => {
  it('marks the document with data-focus-mode while enabled', () => {
    const { rerender } = renderHook(({ on }: { on: boolean }) => useFocusMode(on), {
      initialProps: { on: true },
    });
    expect(document.documentElement.dataset.focusMode).toBe('on');
    rerender({ on: false });
    expect(document.documentElement.dataset.focusMode).toBeUndefined();
  });

  it('requests a screen wake lock on enable', () => {
    renderHook(() => useFocusMode(true));
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('releases the wake lock on disable / unmount', async () => {
    const { unmount } = renderHook(() => useFocusMode(true));
    // Allow the async acquireLock to resolve before unmounting.
    await Promise.resolve();
    await Promise.resolve();
    unmount();
    expect(sentinel?.release).toHaveBeenCalled();
  });

  it('mutes pre-existing audio elements when activated', () => {
    const audio = document.createElement('audio');
    document.body.appendChild(audio);
    expect(audio.muted).toBe(false);
    renderHook(() => useFocusMode(true));
    expect(audio.muted).toBe(true);
  });

  it('silently no-ops when the Wake Lock API is missing', () => {
    uninstallWakeLock();
    expect(() => renderHook(() => useFocusMode(true))).not.toThrow();
    expect(document.documentElement.dataset.focusMode).toBe('on');
  });
});
