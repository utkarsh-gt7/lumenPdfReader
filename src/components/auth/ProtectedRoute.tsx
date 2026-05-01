import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import LoadingSplash from '@/components/LoadingSplash';
import type { ReactNode } from 'react';

/**
 * Gate any nested route on an authenticated user. Preserves the original
 * URL in `location.state.from` so we can bounce back after login.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'loading' || status === 'idle') {
    return <LoadingSplash />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
