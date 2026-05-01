import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ToastHost from '@/components/ToastHost';
import { _resetNotifierForTests, notify } from '@/services/notifier';

beforeEach(() => {
  _resetNotifierForTests();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('<ToastHost />', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastHost />);
    expect(container.firstChild).toBeNull();
  });

  it('renders queued toasts with title and message', () => {
    render(<ToastHost />);
    act(() => {
      notify.success('Saved', 'All good');
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows different visual treatment per tone', () => {
    render(<ToastHost />);
    act(() => {
      notify.error('Boom');
      notify.warning('Watch out');
      notify.info('FYI');
    });
    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(screen.getByText('Watch out')).toBeInTheDocument();
    expect(screen.getByText('FYI')).toBeInTheDocument();
  });

  it('dismisses on close-button click', () => {
    render(<ToastHost />);
    act(() => {
      // Use durationMs=0 so the auto-dismiss timer doesn't race the manual click.
      notify.custom({ tone: 'info', title: 'Closable', durationMs: 0 });
    });
    expect(screen.getByText('Closable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(screen.queryByText('Closable')).not.toBeInTheDocument();
  });

  it('auto-dismisses after the duration elapses', () => {
    render(<ToastHost />);
    act(() => {
      notify.success('Bye');
    });
    expect(screen.getByText('Bye')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByText('Bye')).not.toBeInTheDocument();
  });
});
