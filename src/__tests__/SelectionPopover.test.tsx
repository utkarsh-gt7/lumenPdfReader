import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectionPopover from '@/components/reader/SelectionPopover';
import { HIGHLIGHT_COLORS } from '@/types';

function setup(overrides: Partial<Parameters<typeof SelectionPopover>[0]> = {}) {
  const props = {
    x: 100,
    y: 200,
    canLookup: true,
    onHighlight: vi.fn(),
    onNote: vi.fn(),
    onLookup: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<SelectionPopover {...props} />);
  return props;
}

describe('<SelectionPopover />', () => {
  it('renders one swatch button per highlight color', () => {
    setup();
    for (const c of HIGHLIGHT_COLORS) {
      expect(screen.getByLabelText(`Highlight ${c}`)).toBeInTheDocument();
    }
  });

  it('shows the dictionary action only when canLookup is true', () => {
    setup({ canLookup: false });
    expect(screen.queryByLabelText(/Look up/i)).not.toBeInTheDocument();
  });

  it('fires onHighlight with the selected color', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByLabelText('Highlight blue'));
    expect(props.onHighlight).toHaveBeenCalledWith('blue');
  });

  it('fires onNote, onLookup, onClose for the corresponding buttons', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByLabelText(/Add note/i));
    await user.click(screen.getByLabelText(/Look up/i));
    await user.click(screen.getByLabelText(/Dismiss/i));
    expect(props.onNote).toHaveBeenCalled();
    expect(props.onLookup).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });
});
