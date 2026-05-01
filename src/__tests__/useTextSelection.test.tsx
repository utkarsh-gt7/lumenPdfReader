import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTextSelection } from '@/hooks/useTextSelection';

const originalGetSelection = document.getSelection;

beforeEach(() => {
  document.getSelection = originalGetSelection;
});

afterEach(() => {
  document.getSelection = originalGetSelection;
  document.body.innerHTML = '';
});

function fireSelectionChange() {
  document.dispatchEvent(new Event('selectionchange'));
}

describe('useTextSelection', () => {
  it('starts with no selection', () => {
    const { result } = renderHook(() => useTextSelection());
    expect(result.current.selection).toBeNull();
  });

  it('reports null when the selection is collapsed', () => {
    document.getSelection = vi.fn(() => ({
      isCollapsed: true,
      rangeCount: 0,
      toString: () => '',
      removeAllRanges: vi.fn(),
      getRangeAt: vi.fn(),
    } as unknown as Selection));
    const { result } = renderHook(() => useTextSelection());
    act(() => fireSelectionChange());
    expect(result.current.selection).toBeNull();
  });

  it('reports null when the selected text normalizes to empty', () => {
    document.getSelection = vi.fn(() => ({
      isCollapsed: false,
      rangeCount: 1,
      toString: () => '   \n  ',
      removeAllRanges: vi.fn(),
      getRangeAt: () => ({
        startContainer: document.createTextNode(''),
        endContainer: document.createTextNode(''),
        getClientRects: () => [],
      }),
    } as unknown as Selection));
    const { result } = renderHook(() => useTextSelection());
    act(() => fireSelectionChange());
    expect(result.current.selection).toBeNull();
  });

  it('clear() removes ranges and resets state', () => {
    const removeAllRanges = vi.fn();
    document.getSelection = vi.fn(() => ({
      isCollapsed: true,
      rangeCount: 0,
      toString: () => '',
      removeAllRanges,
      getRangeAt: vi.fn(),
    } as unknown as Selection));
    const { result } = renderHook(() => useTextSelection());
    act(() => result.current.clear());
    expect(removeAllRanges).toHaveBeenCalled();
  });

  it('cleans up the selectionchange listener on unmount', () => {
    const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useTextSelection());
    unmount();
    expect(removeListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
  });
});
