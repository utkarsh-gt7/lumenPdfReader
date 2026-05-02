import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BrightnessOverlay from '@/components/BrightnessOverlay';

describe('<BrightnessOverlay />', () => {
  it('renders a hidden, non-interactive fixed layer', () => {
    render(<BrightnessOverlay />);
    const overlay = screen.getByTestId('brightness-overlay');
    expect(overlay).toHaveAttribute('aria-hidden');
    expect(overlay).toHaveClass('pointer-events-none');
    expect(overlay).toHaveClass('fixed');
  });

  it('uses the brightness-overlay CSS hook for the calc-driven opacity', () => {
    render(<BrightnessOverlay />);
    const overlay = screen.getByTestId('brightness-overlay');
    // The actual calc(1 - var(--brightness)) rule lives in src/index.css
    // (so jsdom's typed-property normaliser doesn't strip it). All we can
    // verify here is that the contract class is present.
    expect(overlay.className).toMatch(/brightness-overlay/);
  });

  it('sits above content but below modal sentinels', () => {
    render(<BrightnessOverlay />);
    const overlay = screen.getByTestId('brightness-overlay');
    expect(overlay.className).toMatch(/z-\[1000\]/);
  });
});
