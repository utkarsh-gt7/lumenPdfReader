import type { DeviceType } from '@/types';

/**
 * Classify the current device based on (1) coarse pointer support and
 * (2) viewport width. The result is stable for the lifetime of the page —
 * it is _not_ reactive to a window resize, because we only use it to drive
 * the one-time gesture onboarding (which never needs to flip mid-session).
 */
export function detectDeviceType(width: number, hasCoarsePointer: boolean): DeviceType {
  if (hasCoarsePointer) {
    return width >= 768 ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

/** SSR-safe wrapper around {@link detectDeviceType}. */
export function getCurrentDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return detectDeviceType(window.innerWidth, coarse);
}
