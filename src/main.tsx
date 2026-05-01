import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import ToastHost from './components/ToastHost.tsx';
import { notify } from './services/notifier.ts';

/**
 * Coerce any thrown / rejected value into a human-readable message.
 * Extracted so the unhandled-rejection handler stays flat and readable.
 */
function describeRejection(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  return 'An unexpected error occurred.';
}

/**
 * Surface unhandled promise rejections (e.g. Firestore timeouts, network
 * failures from the dictionary API) as toasts instead of letting them
 * vanish silently into the console.
 */
window.addEventListener('unhandledrejection', (event) => {
  const { reason } = event;
  console.error('Unhandled promise rejection:', reason);
  notify.error('Something went wrong', describeRejection(reason));
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
      <ToastHost />
    </AppErrorBoundary>
  </StrictMode>,
);
