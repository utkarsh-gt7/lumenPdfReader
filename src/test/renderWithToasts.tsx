import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import ToastHost from '@/components/ToastHost';

/**
 * Wrap any component under test with the global toast renderer so notify.*
 * calls become visible as DOM nodes the test can assert on.
 */
export function renderWithToasts(ui: ReactElement) {
  return render(
    <>
      {ui}
      <ToastHost />
    </>,
  );
}
