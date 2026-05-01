import { useEffect } from 'react';

export interface KeyHandlers {
  ArrowLeft?: () => void;
  ArrowRight?: () => void;
  ArrowUp?: () => void;
  ArrowDown?: () => void;
  Plus?: () => void;
  Minus?: () => void;
  Zero?: () => void;
  B?: () => void;
  Escape?: () => void;
}

/**
 * Wire common reader shortcuts. Skips firing while focus is in an editable
 * field so users can type without surprises.
 */
export function useKeyboardShortcuts(handlers: KeyHandlers): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches?.('input, textarea, select, [contenteditable=""], [contenteditable=true]')) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          handlers.ArrowLeft?.();
          break;
        case 'ArrowRight':
          handlers.ArrowRight?.();
          break;
        case 'ArrowUp':
          handlers.ArrowUp?.();
          break;
        case 'ArrowDown':
          handlers.ArrowDown?.();
          break;
        case '+':
        case '=':
          handlers.Plus?.();
          break;
        case '-':
        case '_':
          handlers.Minus?.();
          break;
        case '0':
          handlers.Zero?.();
          break;
        case 'b':
        case 'B':
          if (!e.metaKey && !e.ctrlKey) handlers.B?.();
          break;
        case 'Escape':
          handlers.Escape?.();
          break;
        default:
          return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
