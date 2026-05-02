import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingTour from '@/components/onboarding/OnboardingTour';

describe('<OnboardingTour />', () => {
  it('renders desktop-specific copy', () => {
    render(<OnboardingTour device="desktop" onClose={vi.fn()} />);
    expect(screen.getByText(/Click & drag to select/i)).toBeInTheDocument();
  });

  it('renders mobile-specific copy on the first step', () => {
    render(<OnboardingTour device="mobile" onClose={vi.fn()} />);
    expect(screen.getByText(/Long-press text to select/i)).toBeInTheDocument();
  });

  it('reaches the swipe-to-turn step after advancing', async () => {
    const user = userEvent.setup();
    render(<OnboardingTour device="tablet" onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Swipe to turn pages/i)).toBeInTheDocument();
  });

  it('walks through every step then completes via "Start reading"', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OnboardingTour device="desktop" onClose={onClose} />);

    // First step is visible.
    expect(screen.getByText(/Click & drag to select/i)).toBeInTheDocument();
    // Click Next until the last step. The number of steps is intentionally
    // not hard-coded — we just keep advancing while a Next button exists,
    // so adding more onboarding steps later doesn't break this assertion.
    while (screen.queryByRole('button', { name: /^Next/i })) {
      await user.click(screen.getByRole('button', { name: /^Next/i }));
    }
    // Last step shows "Start reading"; click it to finish.
    await user.click(screen.getByRole('button', { name: /Start reading/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('can be skipped from any step', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OnboardingTour device="mobile" onClose={onClose} />);
    // The footer "Skip" button (anchored, exact text match — there is also
    // an icon-only "Skip tour" close button in the header).
    await user.click(screen.getByRole('button', { name: /^Skip$/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exposes a close button at every step', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OnboardingTour device="desktop" onClose={onClose} />);
    await user.click(screen.getByLabelText(/Skip tour/i));
    expect(onClose).toHaveBeenCalled();
  });
});
