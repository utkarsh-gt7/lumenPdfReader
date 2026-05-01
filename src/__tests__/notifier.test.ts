import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetNotifierForTests,
  clearToasts,
  dismissToast,
  notify,
  subscribeToasts,
  type Toast,
} from '@/services/notifier';

beforeEach(() => {
  _resetNotifierForTests();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('notifier', () => {
  it('emits an empty list to a fresh subscriber', () => {
    const cb = vi.fn();
    subscribeToasts(cb);
    expect(cb).toHaveBeenCalledWith([]);
  });

  it('publishes new toasts to subscribers', () => {
    const cb = vi.fn();
    subscribeToasts(cb);
    cb.mockClear();
    notify.success('Saved', 'Your changes are stored.');
    expect(cb).toHaveBeenCalledTimes(1);
    const last = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
    expect(last).toHaveLength(1);
    expect(last[0]).toMatchObject({ tone: 'success', title: 'Saved' });
  });

  it.each(['success', 'error', 'info', 'warning'] as const)(
    'supports the %s tone',
    (tone) => {
      const cb = vi.fn();
      subscribeToasts(cb);
      notify[tone]('Hello');
      const last = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
      expect(last[0].tone).toBe(tone);
    },
  );

  it('auto-dismisses after the configured delay', () => {
    const cb = vi.fn();
    subscribeToasts(cb);
    notify.success('Will go away');
    vi.advanceTimersByTime(10_000);
    const last = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
    expect(last).toHaveLength(0);
  });

  it('does not auto-dismiss when durationMs is 0', () => {
    const cb = vi.fn();
    subscribeToasts(cb);
    notify.custom({ tone: 'info', title: 'Sticky', durationMs: 0 });
    vi.advanceTimersByTime(60_000);
    const last = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
    expect(last).toHaveLength(1);
  });

  it('dismissToast removes a specific toast by id', () => {
    const cb = vi.fn();
    subscribeToasts(cb);
    const a = notify.info('A');
    notify.info('B');
    cb.mockClear();
    dismissToast(a);
    const last = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
    expect(last.map((t) => t.title)).toEqual(['B']);
  });

  it('clearToasts removes everything', () => {
    const cb = vi.fn();
    subscribeToasts(cb);
    notify.info('A');
    notify.info('B');
    cb.mockClear();
    clearToasts();
    const last = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
    expect(last).toHaveLength(0);
  });

  it('returns an unsubscribe function', () => {
    const cb = vi.fn();
    const unsub = subscribeToasts(cb);
    cb.mockClear();
    unsub();
    notify.info('Ignored');
    expect(cb).not.toHaveBeenCalled();
  });

  it('error toasts use a longer default duration', () => {
    const cb = vi.fn();
    subscribeToasts(cb);
    notify.error('Boom');
    vi.advanceTimersByTime(5000);
    const after5s = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
    expect(after5s).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    const after8s = cb.mock.calls[cb.mock.calls.length - 1][0] as Toast[];
    expect(after8s).toHaveLength(0);
  });
});
