import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import { useAuthStore } from '@/store/useAuthStore';
import { _resetNotifierForTests } from '@/services/notifier';
import { renderWithToasts } from '@/test/renderWithToasts';

const signInWithGoogle = vi.fn();
const signInWithEmail = vi.fn();
const signUpWithEmail = vi.fn();

beforeEach(() => {
  _resetNotifierForTests();
  signInWithGoogle.mockReset();
  signInWithEmail.mockReset();
  signUpWithEmail.mockReset();
  useAuthStore.setState({
    user: null,
    profile: null,
    status: 'unauthenticated',
    error: null,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderLogin() {
  return renderWithToasts(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>,
  );
}

describe('<Login />', () => {
  it('renders the sign-in form by default', () => {
    renderLogin();
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in$/i })).toBeInTheDocument();
  });

  it('toggles to sign-up mode and back', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /Sign up/i }));
    expect(screen.getByText(/Start reading/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Display name/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Sign in$/ }));
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('submits credentials on sign-in', async () => {
    signInWithEmail.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText(/you@example/i), 'a@b.c');
    await user.type(screen.getByPlaceholderText(/Password/i), 'super-strong');
    await user.click(screen.getByRole('button', { name: /Sign in$/i }));
    expect(signInWithEmail).toHaveBeenCalledWith('a@b.c', 'super-strong');
  });

  it('submits credentials with display name on sign-up', async () => {
    signUpWithEmail.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /Sign up/i }));
    await user.type(screen.getByPlaceholderText(/Display name/i), 'Aria');
    await user.type(screen.getByPlaceholderText(/you@example/i), 'a@b.c');
    await user.type(screen.getByPlaceholderText(/Password/i), 'super-strong');
    await user.click(screen.getByRole('button', { name: /Create account/i }));
    expect(signUpWithEmail).toHaveBeenCalledWith('a@b.c', 'super-strong', 'Aria');
  });

  it('shows a toast when email sign-in fails', async () => {
    signInWithEmail.mockRejectedValue(new Error('bad credentials'));
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText(/you@example/i), 'a@b.c');
    await user.type(screen.getByPlaceholderText(/Password/i), 'short!');
    await user.click(screen.getByRole('button', { name: /Sign in$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Sign-in failed/)).toBeInTheDocument();
    });
  });

  it('triggers Google sign-in', async () => {
    signInWithGoogle.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));
    expect(signInWithGoogle).toHaveBeenCalled();
  });

  it('shows a toast on Google sign-in failure', async () => {
    signInWithGoogle.mockRejectedValue(new Error('popup closed'));
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));
    await waitFor(() => {
      expect(screen.getByText(/Google sign-in failed/i)).toBeInTheDocument();
    });
  });
});
