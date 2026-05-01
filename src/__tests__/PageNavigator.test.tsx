import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageNavigator from '@/components/reader/PageNavigator';

function setup(overrides: Partial<Parameters<typeof PageNavigator>[0]> = {}) {
  const props = {
    page: 5,
    totalPages: 100,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onJump: vi.fn(),
    ...overrides,
  };
  render(<PageNavigator {...props} />);
  return props;
}

describe('<PageNavigator />', () => {
  it('shows the current page over the total', () => {
    setup();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('shows a placeholder for unknown total page count', () => {
    setup({ totalPages: 0 });
    expect(screen.getByText('/ —')).toBeInTheDocument();
  });

  it('fires onPrev / onNext on button clicks', async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByLabelText(/Previous page/i));
    await user.click(screen.getByLabelText(/Next page/i));
    expect(props.onPrev).toHaveBeenCalledTimes(1);
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  it('disables prev on page 1 and next on the final page', () => {
    setup({ page: 1 });
    expect(screen.getByLabelText(/Previous page/i)).toBeDisabled();

    render(<PageNavigator page={50} totalPages={50} onPrev={vi.fn()} onNext={vi.fn()} onJump={vi.fn()} />);
    const nextButtons = screen.getAllByLabelText(/Next page/i);
    expect(nextButtons[nextButtons.length - 1]).toBeDisabled();
  });

  it('calls onJump when the user types a page number', () => {
    const props = setup();
    const input = screen.getByLabelText(/Current page/i);
    // fireEvent.change uses React's tracked-value setter so the controlled
    // input correctly reports the new value to the change handler.
    fireEvent.change(input, { target: { value: '42' } });
    expect(props.onJump).toHaveBeenCalledWith(42);
  });

  it('ignores an empty input', () => {
    const props = setup();
    const input = screen.getByLabelText(/Current page/i);
    fireEvent.change(input, { target: { value: '' } });
    expect(props.onJump).not.toHaveBeenCalled();
  });
});
