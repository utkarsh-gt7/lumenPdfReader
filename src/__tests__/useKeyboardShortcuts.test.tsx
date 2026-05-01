import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function pressKey(key: string, opts: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ...opts }));
}

describe('useKeyboardShortcuts', () => {
  it('routes arrow keys', () => {
    const handlers = {
      ArrowLeft: vi.fn(),
      ArrowRight: vi.fn(),
      ArrowUp: vi.fn(),
      ArrowDown: vi.fn(),
    };
    renderHook(() => useKeyboardShortcuts(handlers));
    pressKey('ArrowLeft');
    pressKey('ArrowRight');
    pressKey('ArrowUp');
    pressKey('ArrowDown');
    Object.values(handlers).forEach((h) => expect(h).toHaveBeenCalledTimes(1));
  });

  it.each([
    ['+', 'Plus'],
    ['=', 'Plus'],
    ['-', 'Minus'],
    ['_', 'Minus'],
    ['0', 'Zero'],
    ['Escape', 'Escape'],
    ['b', 'B'],
    ['B', 'B'],
  ] as const)('routes "%s" to %s handler', (key, slot) => {
    const handlers: Partial<Parameters<typeof useKeyboardShortcuts>[0]> = {
      [slot]: vi.fn(),
    };
    renderHook(() => useKeyboardShortcuts(handlers));
    pressKey(key);
    expect(handlers[slot]).toHaveBeenCalledTimes(1);
  });

  it('ignores B when modifier keys are held (browser bookmarking)', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ B: handler }));
    pressKey('b', { metaKey: true });
    pressKey('b', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('skips firing while focus is in an input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ ArrowRight: handler }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(handler).not.toHaveBeenCalled();

    input.remove();
  });

  it('ignores keys without a registered handler', () => {
    const arr = vi.fn();
    renderHook(() => useKeyboardShortcuts({ ArrowLeft: arr }));
    pressKey('q'); // no handler — should not throw
    expect(arr).not.toHaveBeenCalled();
  });
});
