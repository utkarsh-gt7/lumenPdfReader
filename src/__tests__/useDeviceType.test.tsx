import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDeviceType } from '@/hooks/useDeviceType';

interface MockMql {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

let mockMql: MockMql;

beforeEach(() => {
  mockMql = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(mockMql),
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1280,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDeviceType', () => {
  it('returns "desktop" when pointer is fine', () => {
    mockMql.matches = false;
    const { result } = renderHook(() => useDeviceType());
    expect(result.current).toBe('desktop');
  });

  it('returns "mobile" when pointer is coarse and width < 768', () => {
    mockMql.matches = true;
    (window as { innerWidth: number }).innerWidth = 360;
    const { result } = renderHook(() => useDeviceType());
    expect(result.current).toBe('mobile');
  });

  it('returns "tablet" when pointer is coarse and width >= 768', () => {
    mockMql.matches = true;
    (window as { innerWidth: number }).innerWidth = 1024;
    const { result } = renderHook(() => useDeviceType());
    expect(result.current).toBe('tablet');
  });

  it('reacts to a window resize', () => {
    mockMql.matches = true;
    (window as { innerWidth: number }).innerWidth = 360;
    const { result } = renderHook(() => useDeviceType());
    expect(result.current).toBe('mobile');

    act(() => {
      (window as { innerWidth: number }).innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe('tablet');
  });

  it('cleans up listeners on unmount', () => {
    const { unmount } = renderHook(() => useDeviceType());
    expect(mockMql.addEventListener).toHaveBeenCalled();
    unmount();
    expect(mockMql.removeEventListener).toHaveBeenCalled();
  });
});
