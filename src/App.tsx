import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Login from '@/pages/Login';
import Library from '@/pages/Library';
import Reader from '@/pages/Reader';
import NotesPage from '@/pages/Notes';
import Settings from '@/pages/Settings';
import { isFirebaseConfigured, missingFirebaseConfig } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import SetupRequired from '@/components/SetupRequired';
import LoadingSplash from '@/components/LoadingSplash';
import BrightnessOverlay from '@/components/BrightnessOverlay';
import { DEFAULT_SETTINGS } from '@/types';
import type { ReactNode } from 'react';

function Guarded({ label, children }: { label: string; children: ReactNode }) {
  return <RouteErrorBoundary label={label}>{children}</RouteErrorBoundary>;
}

export default function App() {
  const status = useAuthStore((s) => s.status);
  const init = useAuthStore((s) => s.init);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return init();
  }, [init]);

  /**
   * Sync the user's presentation settings onto the document root:
   *
   *   - `data-theme="light|paper|dark"` powers the `paper:` / `light:`
   *     custom Tailwind variants and theme-specific base styles.
   *   - `class="dark"` is kept in sync for the dark theme so existing
   *     `dark:*` Tailwind utilities keep working unchanged.
   *   - `--font-scale`, `--brightness`, `--reading-font-family` CSS vars
   *     drive the global typography + brightness overlay.
   *
   * All four are derived from one settings object, so the visual state of
   * the app and the persisted profile can never disagree.
   */
  useEffect(() => {
    const settings = profile?.settings ?? DEFAULT_SETTINGS;
    const root = document.documentElement;

    root.dataset.theme = settings.theme;
    root.classList.toggle('dark', settings.theme === 'dark');

    root.style.setProperty('--font-scale', String(settings.fontScale));
    root.style.setProperty('--brightness', String(settings.brightness));
    root.style.setProperty(
      '--reading-font-family',
      settings.fontFamily === 'sans'
        ? "'Inter', system-ui, -apple-system, sans-serif"
        : "'Lora', Charter, Georgia, Cambria, serif",
    );
    // Subscribing to each scalar field individually is intentional —
    // the eslint plugin can't see through optional chaining and would
    // otherwise want the whole `profile?.settings` object as a dep,
    // which would re-run this effect on any unrelated settings change
    // (e.g. focusMode toggling), causing flicker on the brightness var.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.settings.theme,
    profile?.settings.fontScale,
    profile?.settings.brightness,
    profile?.settings.fontFamily,
  ]);

  if (!isFirebaseConfigured()) {
    return <SetupRequired missing={missingFirebaseConfig()} />;
  }

  if (status === 'idle' || status === 'loading') {
    return <LoadingSplash label="Connecting…" />;
  }

  return (
    <BrowserRouter>
      {/* Global screen-dim overlay; reads --brightness from the document root. */}
      <BrightnessOverlay />
      <Routes>
        <Route
          path="/login"
          element={
            <Guarded label="Login">
              <Login />
            </Guarded>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <Guarded label="Library">
                <Library />
              </Guarded>
            }
          />
          <Route
            path="/read/:bookId"
            element={
              <Guarded label="Reader">
                <Reader />
              </Guarded>
            }
          />
          <Route
            path="/notes"
            element={
              <Guarded label="Notes">
                <NotesPage />
              </Guarded>
            }
          />
          <Route
            path="/settings"
            element={
              <Guarded label="Settings">
                <Settings />
              </Guarded>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
