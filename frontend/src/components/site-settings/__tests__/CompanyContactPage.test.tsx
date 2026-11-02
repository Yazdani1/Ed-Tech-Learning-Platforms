import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { CompanyContactPage } from '../CompanyContactPage';

import type { UserRole } from '@/types';

const SAVED = {
  phone: '+880 1700-000000',
  whatsapp: '',
  email: 'hello@example.com',
  address: 'Dhaka',
};

const renderPage = (role: UserRole = 'Admin') => {
  server.use(
    signedInAs(makeUser(role)),
    http.get('*/api/site-settings/public', () => ok({ hiddenPages: [], contact: SAVED })),
  );
  return renderWithProviders(<CompanyContactPage />);
};

describe('CompanyContactPage', () => {
  it('fills the form with the saved contact', async () => {
    renderPage();

    expect(await screen.findByLabelText('Phone number')).toHaveValue('+880 1700-000000');
    expect(screen.getByLabelText('WhatsApp number')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('hello@example.com');
    expect(screen.getByLabelText('Address')).toHaveValue('Dhaka');
  });

  it.each<UserRole>(['Super Admin', 'Admin'])('lets a %s save changes', async (role) => {
    let body: unknown;
    renderPage(role);
    server.use(
      http.put('*/api/site-settings/contact', async ({ request }) => {
        body = await request.json();
        return ok({ hiddenPages: [], contact: { ...SAVED, whatsapp: '01800000000' } });
      }),
    );
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('WhatsApp number'), '01800000000');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Company contact saved')).toBeInTheDocument();
    expect(body).toEqual({ ...SAVED, whatsapp: '01800000000' });
  });

  it('checks the phone, email and address before sending anything', async () => {
    let called = false;
    renderPage();
    server.use(
      http.put('*/api/site-settings/contact', () => {
        called = true;
        return ok({ hiddenPages: [], contact: SAVED });
      }),
    );
    const user = userEvent.setup();

    const phone = await screen.findByLabelText('Phone number');
    await user.clear(phone);
    await user.type(phone, 'abc');
    const email = screen.getByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'not-an-email');
    const address = screen.getByLabelText('Address');
    await user.clear(address);
    await user.click(address);
    await user.paste('x'.repeat(301));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Enter a valid phone number (digits, spaces, dashes, optional +).'),
    ).toBeInTheDocument();
    expect(screen.getByText('Address can be at most 300 characters.')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('empty fields are allowed (they clear the saved value)', async () => {
    let body: unknown;
    renderPage();
    server.use(
      http.put('*/api/site-settings/contact', async ({ request }) => {
        body = await request.json();
        return ok({
          hiddenPages: [],
          contact: { phone: '', whatsapp: '', email: '', address: '' },
        });
      }),
    );
    const user = userEvent.setup();
    for (const label of ['Phone number', 'Email', 'Address']) {
      await user.clear(await screen.findByLabelText(label));
    }
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Company contact saved')).toBeInTheDocument();
    expect(body).toEqual({ phone: '', whatsapp: '', email: '', address: '' });
  });

  it('shows the backend message when saving fails', async () => {
    renderPage();
    server.use(http.put('*/api/site-settings/contact', () => fail(400, 'Invalid phone')));

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Invalid phone')).toBeInTheDocument();
  });

  it.each<UserRole>(['Moderator', 'Teacher', 'Student'])('sends a %s away', async (role) => {
    renderPage(role);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalled();
    });
    expect(screen.queryByLabelText('Phone number')).not.toBeInTheDocument();
  });
});
