import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HighlightLayer from '@/components/reader/HighlightLayer';
import type { Highlight } from '@/types';

const baseHighlight: Highlight = {
  id: 'h1',
  bookId: 'b1',
  page: 1,
  text: 'sample text',
  color: 'yellow',
  createdAt: 0,
  rects: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.05 }],
};

describe('<HighlightLayer />', () => {
  it('renders nothing when page dimensions are zero', () => {
    const { container } = render(
      <HighlightLayer highlights={[baseHighlight]} pageWidth={0} pageHeight={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one rect per highlight rect', () => {
    render(
      <HighlightLayer
        highlights={[
          {
            ...baseHighlight,
            rects: [
              { x: 0, y: 0, width: 0.3, height: 0.05 },
              { x: 0, y: 0.1, width: 0.5, height: 0.05 },
            ],
          },
        ]}
        pageWidth={500}
        pageHeight={650}
      />,
    );
    expect(screen.getAllByLabelText(/Highlighted: sample text/i)).toHaveLength(2);
  });

  it('positions rects using normalized coordinates', () => {
    render(<HighlightLayer highlights={[baseHighlight]} pageWidth={500} pageHeight={650} />);
    const rect = screen.getByLabelText(/Highlighted: sample text/i) as HTMLElement;
    expect(rect.style.left).toBe('10%');
    expect(rect.style.top).toBe('20%');
    expect(rect.style.width).toBe('30%');
    expect(rect.style.height).toBe('5%');
  });

  it('fires onClickHighlight when the user clicks a rect', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <HighlightLayer
        highlights={[baseHighlight]}
        pageWidth={500}
        pageHeight={650}
        onClickHighlight={onClick}
      />,
    );
    await user.click(screen.getByLabelText(/Highlighted: sample text/i));
    expect(onClick).toHaveBeenCalledWith(baseHighlight);
  });
});
