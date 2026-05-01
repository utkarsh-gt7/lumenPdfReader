import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '@/pages/Settings';
import { useAuthStore } from '@/store/useAuthStore';
import { _resetNotifierForTests } from '@/services/notifier';
import { renderWithToasts } from '@/test/renderWithToasts';

const updateSettings = vi.fn();
vi.mock('@/services/repository/profile', () => ({
  updateSettings: (...args: unknown[]) => updateSettings(...args),
}));

beforeEach(() => {
  _resetNotifierForTests();
  updateSettings.mockReset();
  useAuthStore.setState({
    user: { uid: 'u1' } as never,
    profile: {
      uid: 'u1',
      email: 'a@b.c',
      displayName: 'Aria',
      photoURL: null,
      createdAt: 0,
      onboardingShownFor: [],
      settings: { darkMode: true, fontScale: 1 },
    },
    status: 'authenticated',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<Settings />', () => {
  it('renders nothing when there is no profile', () => {
    useAuthStore.setState({ profile: null });
    const { container } = render(<Settings />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the user account row', () => {
    render(<Settings />);
    expect(screen.getByText('a@b.c')).toBeInTheDocument();
    expect(screen.getByText(/UID: u1/)).toBeInTheDocument();
  });

  it('toggles dark mode and persists', async () => {
    updateSettings.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Settings />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith('u1', { darkMode: false });
    });
  });

  it('rolls back the optimistic toggle on a save failure', async () => {
    updateSettings.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    renderWithToasts(<Settings />);
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    await waitFor(() => {
      expect(screen.getByText(/Save failed/)).toBeInTheDocument();
    });
    expect(useAuthStore.getState().profile?.settings.darkMode).toBe(true);
  });

  it('updates the font scale slider', async () => {
    updateSettings.mockResolvedValue(undefined);
    render(<Settings />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '1.15' } });
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith('u1', { fontScale: 1.15 });
    });
  });
});
