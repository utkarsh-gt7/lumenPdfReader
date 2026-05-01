import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadingSplash from '@/components/LoadingSplash';
import SetupRequired from '@/components/SetupRequired';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import AppErrorBoundary from '@/components/AppErrorBoundary';

describe('<LoadingSplash />', () => {
  it('uses a default label', () => {
    render(<LoadingSplash />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('respects a custom label', () => {
    render(<LoadingSplash label="Connecting…" />);
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
  });
});

describe('<SetupRequired />', () => {
  it('lists missing variables', () => {
    render(<SetupRequired missing={['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID']} />);
    expect(screen.getByText(/configuration required/i)).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_API_KEY/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_PROJECT_ID/)).toBeInTheDocument();
  });

  it('shows a generic message when no variables are missing', () => {
    render(<SetupRequired missing={[]} />);
    expect(screen.getByText(/initialization failed/i)).toBeInTheDocument();
  });
});

function Bomb({ throws }: { throws: boolean }) {
  if (throws) throw new Error('kaboom');
  return <p>safe</p>;
}

describe('<RouteErrorBoundary />', () => {
  it('renders children when nothing throws', () => {
    render(
      <RouteErrorBoundary label="Test">
        <Bomb throws={false} />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText('safe')).toBeInTheDocument();
  });

  it('renders a fallback and lets the user retry', async () => {
    const user = userEvent.setup();
    // suppress React's intentional error log in test output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let willThrow = true;
    function Wrapper() {
      return <Bomb throws={willThrow} />;
    }
    const { rerender } = render(
      <RouteErrorBoundary label="Reader">
        <Wrapper />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText(/Reader: kaboom/)).toBeInTheDocument();
    willThrow = false;
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    rerender(
      <RouteErrorBoundary label="Reader">
        <Wrapper />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText('safe')).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('<AppErrorBoundary />', () => {
  it('renders children normally', () => {
    render(
      <AppErrorBoundary>
        <p>app content</p>
      </AppErrorBoundary>,
    );
    expect(screen.getByText('app content')).toBeInTheDocument();
  });

  it('renders fallback UI on error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AppErrorBoundary>
        <Bomb throws />
      </AppErrorBoundary>,
    );
    expect(screen.getByText(/Something broke/i)).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload the app/i })).toBeInTheDocument();
    spy.mockRestore();
  });
});
