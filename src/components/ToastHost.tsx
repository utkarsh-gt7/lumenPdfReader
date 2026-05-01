import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { dismissToast, subscribeToasts, type Toast } from '@/services/notifier';
import { cn } from '@/utils/cn';

const ICONS: Record<Toast['tone'], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONE_STYLES: Record<Toast['tone'], string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800',
  error: 'border-red-300 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-100 dark:border-red-800',
  info: 'border-royal-300 bg-royal-50 text-royal-900 dark:bg-royal-900/40 dark:text-royal-100 dark:border-royal-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800',
};

/**
 * Fixed-position toast renderer. Subscribes to the notifier pub/sub.
 *
 * Stacked top-right on desktop, full-width bottom on mobile so it doesn't
 * cover the page-turn arrows.
 */
export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-[100] pointer-events-none
                 bottom-4 left-1/2 -translate-x-1/2 w-[min(100%-1rem,28rem)]
                 sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto sm:translate-x-0 sm:w-80
                 flex flex-col-reverse gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto rounded-lg border px-3 py-2 shadow-page',
              'animate-slide-up flex gap-2 items-start',
              TONE_STYLES[t.tone],
            )}
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{t.title}</p>
              {t.message ? <p className="text-xs opacity-80 mt-0.5">{t.message}</p> : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              className="opacity-60 hover:opacity-100 -mt-0.5"
              onClick={() => dismissToast(t.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
