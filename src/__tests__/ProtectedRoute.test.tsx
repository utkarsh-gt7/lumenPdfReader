import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore';

beforeEach(() => {
  useAuthStore.setState({ user: null, profile: null, status: 'idle', error: null });
});

function renderWithRouter(initial = '/secret') {
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<p>login screen</p>} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute>
              <p>secret content</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<ProtectedRoute />', () => {
  it('shows the loading splash while auth is in flight', () => {
    useAuthStore.setState({ status: 'loading' });
    renderWithRouter();
    expect(screen.getByText(/Loading…/)).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    useAuthStore.setState({ status: 'unauthenticated' });
    renderWithRouter();
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    useAuthStore.setState({ status: 'authenticated' });
    renderWithRouter();
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });
});
