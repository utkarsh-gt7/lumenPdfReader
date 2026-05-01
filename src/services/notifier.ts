/**
 * A lightweight pub/sub for in-app toast notifications.
 *
 * The API is intentionally minimal so any layer (services, stores, error
 * boundaries) can `notify.error('Title', 'Description')` without pulling in
 * a UI dependency. The {@link ToastHost} component is the sole subscriber
 * that renders them on screen.
 */

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
  /** Auto-dismiss delay in ms. 0 = sticky until manually dismissed. */
  durationMs: number;
}

type Listener = (toasts: Toast[]) => void;

const listeners = new Set<Listener>();
let toasts: Toast[] = [];

function emit() {
  for (const l of listeners) l(toasts);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function clearToasts(): void {
  toasts = [];
  emit();
}

function push(tone: ToastTone, title: string, message?: string, durationMs = 4500): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  toasts = [...toasts, { id, tone, title, message, durationMs }];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismissToast(id), durationMs);
  }
  return id;
}

export const notify = {
  success: (title: string, message?: string) => push('success', title, message),
  error: (title: string, message?: string) => push('error', title, message, 7000),
  info: (title: string, message?: string) => push('info', title, message),
  warning: (title: string, message?: string) => push('warning', title, message),
  custom: (toast: Omit<Toast, 'id'>) => push(toast.tone, toast.title, toast.message, toast.durationMs),
};

/** Test-only: drop all listeners and queued toasts. */
export function _resetNotifierForTests(): void {
  toasts = [];
  listeners.clear();
}
