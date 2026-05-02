import { useEffect } from 'react';

/**
 * Runtime feature-detect the Wake Lock API. lib.dom declares
 * `Navigator.wakeLock` as a non-optional property since TS 5.x, so we
 * defensively check at runtime — Firefox and older Safari simply omit it.
 */
function getWakeLock(): { request(type: 'screen'): Promise<WakeLockSentinel> } | null {
  const candidate = (navigator as unknown as { wakeLock?: unknown }).wakeLock;
  return candidate && typeof candidate === 'object' && 'request' in candidate
    ? (candidate as { request(type: 'screen'): Promise<WakeLockSentinel> })
    : null;
}

/**
 * Activates "Focus Mode" while mounted with `enabled === true`.
 *
 * When on, Focus Mode does three concrete things from a webpage's reach:
 *
 *   1. Acquires a Wake Lock so the screen doesn't sleep mid-paragraph.
 *      Auto-reacquires on visibilitychange so flipping tabs and coming
 *      back doesn't lose the lock.
 *   2. Mutes every `<audio>`/`<video>` element on the page (e.g. the
 *      dictionary pronunciation button) so reading is silent.
 *   3. Adds a `data-focus-mode="on"` attribute to <html>; the ToastHost
 *      reads this and quiets non-critical notifications.
 *
 * What it cannot do:
 *
 *   - Silence native OS notifications from other apps. That requires
 *     OS-level permission a webpage can never have. We document this
 *     limitation in the Settings UI rather than pretending otherwise.
 */
export function useFocusMode(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    document.documentElement.dataset.focusMode = 'on';

    // 1. Wake lock — re-request on visibilitychange because the browser
    //    silently releases the lock when the tab goes to the background.
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquireLock = async () => {
      const api = getWakeLock();
      if (!api) return;
      try {
        const sentinel = await api.request('screen');
        if (cancelled) {
          await sentinel.release();
          return;
        }
        lock = sentinel;
      } catch (err) {
        console.warn('[useFocusMode] wake lock denied:', err);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lock?.released) {
        void acquireLock();
      }
    };

    void acquireLock();
    document.addEventListener('visibilitychange', onVisibility);

    // 2. Mute every existing audio/video and any future ones (the
    //    dictionary drawer creates one on demand). MutationObserver lets
    //    us stay generic without coupling to specific components.
    const muteAll = () => {
      document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((m) => {
        m.muted = true;
        m.pause();
      });
    };
    muteAll();
    const observer = new MutationObserver(muteAll);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      document.documentElement.removeAttribute('data-focus-mode');
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
      if (lock && !lock.released) void lock.release();
    };
  }, [enabled]);
}
