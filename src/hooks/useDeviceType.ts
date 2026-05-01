import { useEffect, useState } from 'react';
import type { DeviceType } from '@/types';
import { detectDeviceType } from '@/utils/device';

/**
 * Reactive device-type hook. Listens to viewport resize and pointer-type
 * changes (e.g. plugging in a mouse on a tablet). The result drives the
 * gesture onboarding tour and the touch-vs-keyboard hint copy.
 */
export function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    return detectDeviceType(window.innerWidth, coarse);
  });

  useEffect(() => {
    const recalc = () => {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      setDevice(detectDeviceType(window.innerWidth, coarse));
    };
    window.addEventListener('resize', recalc);
    const mq = window.matchMedia?.('(pointer: coarse)');
    mq?.addEventListener?.('change', recalc);
    return () => {
      window.removeEventListener('resize', recalc);
      mq?.removeEventListener?.('change', recalc);
    };
  }, []);

  return device;
}
