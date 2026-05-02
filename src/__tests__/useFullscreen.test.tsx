import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFullscreen } from '@/hooks/useFullscreen';

/**
 * jsdom doesn't implement the Fullscreen API, so we install a tiny harness
 * on `document` + `HTMLElement.prototype` and drive it via fake calls.
 * The hook defaults its target to `document.documentElement`, so we just
 * pin that one element as the captured fullscreen target — no need to
 * alias `this` from a prototype method (which the lint rule blocks).
 */
let fsElement: Element | null = null;
const fakeRequest = vi.fn(async () => {
  fsElement = document.documentElement;
  document.dispatchEvent(new Event('fullscreenchange'));
});

function installHarness() {
  fsElement = null;
  fakeRequest.mockClear();
  fakeRequest.mockImplementation(async () => {
    fsElement = document.documentElement;
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fsElement,
  });
  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    configurable: true,
    value: fakeRequest,
    writable: true,
  });
  document.exitFullscreen = vi.fn(async () => {
    fsElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
  });
}

beforeEach(installHarness);

afterEach(() => {
  // Clean up to avoid leaking the harness into unrelated suites.
  delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen;
  delete (document as { exitFullscreen?: unknown }).exitFullscreen;
  fsElement = null;
});

describe('useFullscreen', () => {
  it('reports unsupported when the API is missing', () => {
    delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen;
    const { result } = renderHook(() => useFullscreen(null));
    expect(result.current.isSupported).toBe(false);
  });

  it('enters fullscreen and tracks the change event', async () => {
    const { result } = renderHook(() => useFullscreen(null));
    expect(result.current.isFullscreen).toBe(false);
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.isFullscreen).toBe(true);
  });

  it('exits when toggled while active', async () => {
    const { result } = renderHook(() => useFullscreen(null));
    await act(async () => {
      await result.current.toggle();
    });
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.isFullscreen).toBe(false);
  });

  it('sync state on external fullscreenchange (e.g. user pressed Esc)', async () => {
    const { result } = renderHook(() => useFullscreen(null));
    await act(async () => {
      await result.current.enter();
    });
    expect(result.current.isFullscreen).toBe(true);
    await act(async () => {
      fsElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(result.current.isFullscreen).toBe(false);
  });

  it('swallows enter() failures so callers never see a rejected promise', async () => {
    fakeRequest.mockImplementation(async () => {
      throw new Error('user gesture required');
    });
    const { result } = renderHook(() => useFullscreen(null));
    await expect(result.current.enter()).resolves.toBeUndefined();
  });
});
