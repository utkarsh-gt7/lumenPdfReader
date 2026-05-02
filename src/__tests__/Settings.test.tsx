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
      settings: {
        theme: 'paper',
        brightness: 1,
        focusMode: false,
        fontFamily: 'serif',
        fontScale: 1,
      },
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

  it('marks the active theme radio as checked', () => {
    render(<Settings />);
    const paper = screen.getByRole('radio', { name: /Paper/i });
    expect(paper).toHaveAttribute('aria-checked', 'true');
  });

  it('switches theme and persists the choice', async () => {
    updateSettings.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('radio', { name: /Night/i }));
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith('u1', { theme: 'dark' });
    });
  });

  it('rolls back the optimistic theme change on a save failure', async () => {
    updateSettings.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    renderWithToasts(<Settings />);
    await user.click(screen.getByRole('radio', { name: /Light/i }));
    await waitFor(() => {
      expect(screen.getByText(/Save failed/)).toBeInTheDocument();
    });
    expect(useAuthStore.getState().profile?.settings.theme).toBe('paper');
  });

  it('updates the UI scale slider on commit', async () => {
    updateSettings.mockResolvedValue(undefined);
    render(<Settings />);
    const slider = screen.getByLabelText(/UI scale/i);
    fireEvent.change(slider, { target: { value: '1.15' } });
    fireEvent.mouseUp(slider);
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith('u1', { fontScale: 1.15 });
    });
  });

  it('updates brightness on commit', async () => {
    updateSettings.mockResolvedValue(undefined);
    render(<Settings />);
    const slider = screen.getByLabelText(/Brightness/i);
    fireEvent.change(slider, { target: { value: '0.6' } });
    fireEvent.mouseUp(slider);
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith('u1', { brightness: 0.6 });
    });
  });

  it('toggles focus mode and persists', async () => {
    updateSettings.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Settings />);
    const toggle = screen.getByRole('switch', { name: /Focus mode/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith('u1', { focusMode: true });
    });
  });

  it('switches the reading font family', async () => {
    updateSettings.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('radio', { name: /Sans/i }));
    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith('u1', { fontFamily: 'sans' });
    });
  });
});
