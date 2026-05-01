import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Per-route boundary. Limits the blast radius of a crash to the page the
 * user is on — the surrounding shell (header, nav) stays usable so they
 * can navigate elsewhere.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Route: ${this.props.label}] error:`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="card p-6 text-center space-y-4">
          <AlertTriangle className="mx-auto w-8 h-8 text-amber-500" />
          <div>
            <h2 className="font-display text-xl">This page hit an error.</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
              {this.props.label}: {this.state.error.message}
            </p>
          </div>
          <button type="button" onClick={this.reset} className="btn-secondary mx-auto">
            Try again
          </button>
        </div>
      </div>
    );
  }
}
