import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { ListPagination } from '../ListPagination';

describe('ListPagination', () => {
  it('is hidden when everything fits on one page', () => {
    renderWithProviders(<ListPagination page={1} limit={10} total={10} onPageChange={vi.fn()} />);
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('shows the range and the page buttons, and reports the chosen page', async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <ListPagination page={2} limit={10} total={57} onPageChange={onPageChange} />,
    );
    const user = userEvent.setup();

    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByText('Showing 11-20 of 57')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('shows the last range and disables Next on the last page', () => {
    renderWithProviders(<ListPagination page={6} limit={10} total={57} onPageChange={vi.fn()} />);

    expect(screen.getByText('Showing 51-57 of 57')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
