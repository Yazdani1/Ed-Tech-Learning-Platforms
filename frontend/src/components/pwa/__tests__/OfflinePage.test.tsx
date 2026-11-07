import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { OfflinePage } from '../OfflinePage';

describe('OfflinePage (/offline)', () => {
  it('says the visitor is offline and reloads on "Try again"', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { href: window.location.href, reload });
    renderWithProviders(<OfflinePage />);

    expect(screen.getByRole('heading', { name: 'You are offline' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
