import { describe, expect, it } from 'vitest';
import { detectDeviceType, getCurrentDeviceType } from '@/utils/device';

describe('detectDeviceType', () => {
  it('classifies a phone as mobile', () => {
    expect(detectDeviceType(360, true)).toBe('mobile');
  });

  it('classifies a tablet as tablet', () => {
    expect(detectDeviceType(820, true)).toBe('tablet');
  });

  it('classifies a 768px coarse-pointer device as tablet', () => {
    expect(detectDeviceType(768, true)).toBe('tablet');
  });

  it('always classifies fine-pointer devices as desktop, regardless of width', () => {
    expect(detectDeviceType(360, false)).toBe('desktop');
    expect(detectDeviceType(2560, false)).toBe('desktop');
  });
});

describe('getCurrentDeviceType', () => {
  it('returns a valid device type', () => {
    const result = getCurrentDeviceType();
    expect(['mobile', 'tablet', 'desktop']).toContain(result);
  });
});
