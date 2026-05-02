import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBrightnessGesture } from '@/hooks/useBrightnessGesture';

const ORIGINAL_INNER_WIDTH = window.innerWidth;

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
});

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: ORIGINAL_INNER_WIDTH,
  });
});

/**
 * jsdom does not provide a Touch constructor, so we hand-build minimal
 * Touch-shaped objects and dispatch raw TouchEvent instances. The hook
 * only reads `touches[0].clientX/clientY` so this is enough.
 */
function fakeTouch(clientX: number, clientY: number): Touch {
  return { clientX, clientY, identifier: 0 } as unknown as Touch;
}

function dispatchTouch(type: 'touchstart' | 'touchmove' | 'touchend', touch: Touch) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', {
    configurable: true,
    value: type === 'touchend' ? [] : [touch],
  });
  window.dispatchEvent(event);
}

describe('useBrightnessGesture', () => {
  it('raises brightness on an upward right-edge drag', () => {
    let value = 0.5;
    const write = vi.fn((v: number) => {
      value = v;
    });
    renderHook(() =>
      useBrightnessGesture({
        read: () => value,
        write,
      }),
    );

    dispatchTouch('touchstart', fakeTouch(990, 500));
    dispatchTouch('touchmove', fakeTouch(990, 200)); // 300px up
    expect(write).toHaveBeenCalled();
    expect(write.mock.calls.at(-1)?.[0]).toBeGreaterThan(0.5);
  });

  it('lowers brightness on a downward right-edge drag', () => {
    let value = 0.8;
    const write = vi.fn((v: number) => {
      value = v;
    });
    renderHook(() =>
      useBrightnessGesture({
        read: () => value,
        write,
      }),
    );

    dispatchTouch('touchstart', fakeTouch(990, 100));
    dispatchTouch('touchmove', fakeTouch(990, 400)); // 300px down
    expect(write.mock.calls.at(-1)?.[0]).toBeLessThan(0.8);
  });

  it('ignores drags that start outside the right-edge zone', () => {
    const write = vi.fn();
    renderHook(() =>
      useBrightnessGesture({
        read: () => 0.5,
        write,
      }),
    );
    dispatchTouch('touchstart', fakeTouch(100, 500));
    dispatchTouch('touchmove', fakeTouch(100, 100));
    expect(write).not.toHaveBeenCalled();
  });

  it('clamps the produced value into [0.3, 1]', () => {
    const write = vi.fn();
    renderHook(() =>
      useBrightnessGesture({
        read: () => 0.5,
        write,
      }),
    );
    // Massive sweep up — would overshoot 1 without clamping.
    dispatchTouch('touchstart', fakeTouch(990, 600));
    dispatchTouch('touchmove', fakeTouch(990, -10000));
    expect(write.mock.calls.at(-1)?.[0]).toBeLessThanOrEqual(1);
  });

  it('responds to keyboard [ and ] on the body', () => {
    let value = 0.5;
    const write = vi.fn((v: number) => {
      value = v;
    });
    renderHook(() =>
      useBrightnessGesture({
        read: () => value,
        write,
      }),
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ']' }));
    expect(write.mock.calls.at(-1)?.[0]).toBeGreaterThan(0.5);

    value = 0.5;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '[' }));
    expect(write.mock.calls.at(-1)?.[0]).toBeLessThan(0.5);
  });

  it('skips key shortcuts when focus is in an input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const write = vi.fn();
    renderHook(() =>
      useBrightnessGesture({
        read: () => 0.5,
        write,
      }),
    );
    const evt = new KeyboardEvent('keydown', { key: ']', bubbles: true });
    input.dispatchEvent(evt);
    expect(write).not.toHaveBeenCalled();
    input.remove();
  });

  it('responds to Alt + wheel on desktop and ignores plain wheel', () => {
    const write = vi.fn();
    renderHook(() =>
      useBrightnessGesture({
        read: () => 0.5,
        write,
      }),
    );
    // Plain wheel — should be ignored.
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    expect(write).not.toHaveBeenCalled();
    // Alt + wheel down → dimmer.
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, altKey: true }));
    expect(write).toHaveBeenCalled();
    expect(write.mock.calls.at(-1)?.[0]).toBeLessThan(0.5);
  });
});
