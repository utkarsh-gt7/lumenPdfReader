import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ZoomControls from '@/components/reader/ZoomControls';

describe('<ZoomControls />', () => {
  it('renders the zoom percentage', () => {
    render(<ZoomControls zoom={1.5} onZoomIn={vi.fn()} onZoomOut={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByLabelText(/Reset zoom/i)).toHaveTextContent('150%');
  });

  it('rounds zoom to the nearest integer', () => {
    render(<ZoomControls zoom={1.234} onZoomIn={vi.fn()} onZoomOut={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByLabelText(/Reset zoom/i)).toHaveTextContent('123%');
  });

  it('fires the right callbacks for each control', async () => {
    const user = userEvent.setup();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onReset = vi.fn();
    render(
      <ZoomControls zoom={1} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onReset} />,
    );
    await user.click(screen.getByLabelText(/Zoom in/i));
    await user.click(screen.getByLabelText(/Zoom out/i));
    await user.click(screen.getByLabelText(/Reset zoom/i));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
