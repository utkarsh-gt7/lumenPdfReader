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

  // Sync `dark` class on <html> to the user's preference.
  useEffect(() => {
    const dark = profile?.settings.darkMode ?? true;
    document.documentElement.classList.toggle('dark', dark);
  }, [profile?.settings.darkMode]);

  if (!isFirebaseConfigured()) {
    return <SetupRequired missing={missingFirebaseConfig()} />;
  }

  if (status === 'idle' || status === 'loading') {
    return <LoadingSplash label="Connecting…" />;
  }

  return (
    <BrowserRouter>
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
