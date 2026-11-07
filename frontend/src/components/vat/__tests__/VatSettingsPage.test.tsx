import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { VatSettingsPage } from '../VatSettingsPage';

import type { UserRole } from '@/types';

const HISTORY = [
  {
    _id: 'h1',
    action: 'vat.update',
    actor: { _id: 'u1', name: 'Rahim Admin', role: 'Super Admin' },
    before: { vatPercent: 0 },
    after: { vatPercent: 15 },
    createdAt: '2026-11-01T10:00:00.000Z',
  },
];

const renderPage = (role: UserRole = 'Super Admin') => {
  server.use(signedInAs(makeUser(role)));
  return renderWithProviders(
    <ConfirmProvider>
      <VatSettingsPage />
    </ConfirmProvider>,
  );
};

describe('VatSettingsPage (/admin/vat)', () => {
  it('shows the rate and who changed it when', async () => {
    server.use(http.get('*/api/site-settings/vat', () => ok({ vatPercent: 15, history: HISTORY })));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Set up VAT' })).toBeInTheDocument();
    expect(await screen.findByLabelText('VAT percentage')).toHaveValue(15);
    const history = screen.getByRole('list', { name: 'Change history' });
    expect(within(history).getByText('VAT changed from 0% to 15%')).toBeInTheDocument();
    expect(within(history).getByText(/Rahim Admin \(Super Admin\)/)).toBeInTheDocument();
  });

  it('asks before saving a new rate and sends it as a number', async () => {
    let sent: unknown;
    server.use(
      http.get('*/api/site-settings/vat', () => ok({ vatPercent: 15, history: HISTORY })),
      http.put('*/api/site-settings/vat', async ({ request }) => {
        sent = await request.json();
        return ok({ vatPercent: 7.5, history: HISTORY });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    const field = await screen.findByLabelText('VAT percentage');
    await user.clear(field);
    await user.type(field, '7.5');
    await user.click(screen.getByRole('button', { name: 'Save VAT' }));
    const confirm = await screen.findByRole('dialog', { name: 'Change the VAT rate?' });
    expect(within(confirm).getByText(/from 15% to 7.5%/)).toBeInTheDocument();
    await user.click(within(confirm).getByRole('button', { name: 'Save VAT' }));

    await waitFor(() => {
      expect(sent).toEqual({ vatPercent: 7.5 });
    });
    expect(await screen.findByText('VAT set to 7.5%')).toBeInTheDocument();
  });

  it('refuses a rate above 100 or with more than 2 decimals', async () => {
    server.use(http.get('*/api/site-settings/vat', () => ok({ vatPercent: 0, history: [] })));
    renderPage();
    const user = userEvent.setup();

    const field = await screen.findByLabelText('VAT percentage');
    await user.clear(field);
    await user.type(field, '120');
    await user.click(screen.getByRole('button', { name: 'Save VAT' }));
    expect(await screen.findByText('VAT must be from 0 to 100')).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, '5.123');
    await user.click(screen.getByRole('button', { name: 'Save VAT' }));
    expect(await screen.findByText('Use at most 2 decimals')).toBeInTheDocument();
  });

  it('shows the error with retry', async () => {
    server.use(http.get('*/api/site-settings/vat', () => fail(500, 'VAT unavailable')));
    renderPage();
    expect(await screen.findByText('VAT unavailable')).toBeInTheDocument();
  });

  it('is for Super Admins only', async () => {
    server.use(http.get('*/api/site-settings/vat', () => ok({ vatPercent: 0, history: [] })));
    renderPage('Admin');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalled();
    });
    expect(screen.queryByRole('heading', { name: 'Set up VAT' })).not.toBeInTheDocument();
  });
});
