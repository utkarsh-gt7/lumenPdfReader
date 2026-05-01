import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level safety net. Catches anything not handled by route-scoped
 * boundaries so the user always sees a friendly screen instead of a
 * blank white page.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — production deployments can wire this into a real
    // error-reporting service (Sentry, Rollbar) by editing this method only.
    console.error('AppErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-ink-950 text-ink-50">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl mb-2">Something broke.</h1>
            <p className="text-sm text-ink-400">{this.state.error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary mx-auto"
          >
            <RotateCcw className="w-4 h-4" /> Reload the app
          </button>
        </div>
      </div>
    );
  }
}
