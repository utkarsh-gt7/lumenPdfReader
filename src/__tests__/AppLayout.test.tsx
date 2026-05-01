import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/useAuthStore';

const signOut = vi.fn();

beforeEach(() => {
  signOut.mockReset();
  useAuthStore.setState({
    user: { uid: 'u' } as never,
    profile: {
      uid: 'u',
      email: 'a@b.c',
      displayName: 'Aria',
      photoURL: null,
      createdAt: 0,
      onboardingShownFor: [],
      settings: { darkMode: true, fontScale: 1 },
    },
    status: 'authenticated',
    signOut,
  });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<p>library</p>} />
          <Route path="/notes" element={<p>notes</p>} />
          <Route path="/read/:id" element={<p>reader</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('<AppLayout />', () => {
  it('renders the chrome on non-reader routes', () => {
    renderAt('/');
    expect(screen.getByText('Lumen')).toBeInTheDocument();
    expect(screen.getByText('library')).toBeInTheDocument();
    expect(screen.getByText('Aria')).toBeInTheDocument();
  });

  it('hides the chrome on the reader route', () => {
    renderAt('/read/abc');
    expect(screen.getByText('reader')).toBeInTheDocument();
    expect(screen.queryByText('Lumen')).not.toBeInTheDocument();
  });

  it('falls back to email when no displayName is set', () => {
    useAuthStore.setState({
      profile: {
        uid: 'u',
        email: 'fallback@example.com',
        displayName: null,
        photoURL: null,
        createdAt: 0,
        onboardingShownFor: [],
        settings: { darkMode: true, fontScale: 1 },
      },
    });
    renderAt('/');
    expect(screen.getByText('fallback@example.com')).toBeInTheDocument();
  });

  it('signs out when the icon button is clicked', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByLabelText(/Sign out/i));
    expect(signOut).toHaveBeenCalled();
  });
});
