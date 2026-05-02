import { useCallback, useEffect, useState } from 'react';

/**
 * Subset of the Fullscreen API that we actually use, written defensively
 * because Safari (esp. iOS) hides everything behind webkit-prefixed
 * variants that aren't always typed by lib.dom.
 */
interface FullscreenDoc extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

function getFullscreenElement(): Element | null {
  const d = document as FullscreenDoc;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? d.msFullscreenElement ?? null;
}

async function requestFs(target: HTMLElement): Promise<void> {
  const el = target as FullscreenElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
  throw new Error('Fullscreen API not supported in this browser.');
}

async function exitFs(): Promise<void> {
  const d = document as FullscreenDoc;
  if (d.exitFullscreen) return d.exitFullscreen();
  if (d.webkitExitFullscreen) return d.webkitExitFullscreen();
  if (d.msExitFullscreen) return d.msExitFullscreen();
}

/**
 * Reactive Fullscreen API wrapper.
 *
 * Returns the current fullscreen state and a stable `toggle` function.
 * Listens to `fullscreenchange` (and prefixed variants) so the hook stays
 * accurate even when the user presses Esc or the OS pulls them out of
 * fullscreen for a system event (incoming call, notification permission
 * prompt, etc.).
 *
 * @param target  Element to request fullscreen on. Defaults to the
 *                document root so the entire app — chrome included —
 *                gets the immersive treatment.
 */
/** Probe support once at module scope — it's a static browser capability. */
function detectFullscreenSupport(): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.documentElement as FullscreenElement;
  return Boolean(
    probe.requestFullscreen ?? probe.webkitRequestFullscreen ?? probe.msRequestFullscreen,
  );
}

export function useFullscreen(target?: HTMLElement | null) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(getFullscreenElement()));
  // Computed lazily so we don't trigger a synchronous setState inside an
  // effect (which the react-hooks/set-state-in-effect rule flags as a
  // performance smell). Support is a static capability that won't change
  // after mount, so the lazy initializer is the right fit.
  const [isSupported] = useState<boolean>(detectFullscreenSupport);

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(getFullscreenElement()));
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    document.addEventListener('msfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      document.removeEventListener('msfullscreenchange', sync);
    };
  }, []);

  const enter = useCallback(async () => {
    try {
      await requestFs(target ?? document.documentElement);
    } catch (err) {
      // Fullscreen requests must originate from a user gesture; if the
      // browser refuses we surface the error so callers can react (e.g.
      // showing a toast). We don't notify here to keep the hook UI-free.
      console.warn('[useFullscreen] enter failed:', err);
    }
  }, [target]);

  const exit = useCallback(async () => {
    try {
      await exitFs();
    } catch (err) {
      console.warn('[useFullscreen] exit failed:', err);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) await exit();
    else await enter();
  }, [enter, exit]);

  return { isFullscreen, isSupported, enter, exit, toggle };
}
