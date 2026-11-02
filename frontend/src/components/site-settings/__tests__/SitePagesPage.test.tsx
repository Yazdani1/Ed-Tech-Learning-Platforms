import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { SitePagesPage } from '../SitePagesPage';

import type { UserRole } from '@/types';

const CONTACT = { phone: '', whatsapp: '', email: '', address: '' };

const renderPage = (hiddenPages: string[] = [], role: UserRole = 'Super Admin') => {
  server.use(
    signedInAs(makeUser(role)),
    http.get('*/api/site-settings/public', () => ok({ hiddenPages, contact: CONTACT })),
  );
  return renderWithProviders(<SitePagesPage />);
};

describe('SitePagesPage', () => {
  it('lists the six public pages with a switch each, on unless hidden', async () => {
    renderPage(['pricing']);

    const list = await screen.findByRole('list', { name: 'Public pages' });
    expect(within(list).getAllByRole('switch')).toHaveLength(6);
    expect(await screen.findByRole('switch', { name: 'Show Pricing' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Show All Courses' })).toBeChecked();
    expect(screen.getByText('/pricing · Hidden')).toBeInTheDocument();
    expect(screen.getByText('/courses · Active')).toBeInTheDocument();
  });

  it('hides a page: sends the full hiddenPages list and says so', async () => {
    let body: unknown;
    renderPage(['teachers']);
    server.use(
      http.put('*/api/site-settings/pages', async ({ request }) => {
        body = await request.json();
        return ok({ hiddenPages: ['teachers', 'pricing'], contact: CONTACT });
      }),
    );

    await userEvent.setup().click(await screen.findByRole('switch', { name: 'Show Pricing' }));

    expect(await screen.findByText('Pricing is hidden')).toBeInTheDocument();
    expect(body).toEqual({ hiddenPages: ['teachers', 'pricing'] });
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Show Pricing' })).not.toBeChecked();
    });
  });

  it('shows a hidden page again', async () => {
    let body: unknown;
    renderPage(['pricing', 'teachers']);
    server.use(
      http.put('*/api/site-settings/pages', async ({ request }) => {
        body = await request.json();
        return ok({ hiddenPages: ['teachers'], contact: CONTACT });
      }),
    );

    await userEvent.setup().click(await screen.findByRole('switch', { name: 'Show Pricing' }));

    expect(await screen.findByText('Pricing is visible again')).toBeInTheDocument();
    expect(body).toEqual({ hiddenPages: ['teachers'] });
  });

  it('shows the backend message when saving fails and keeps the switch as it was', async () => {
    renderPage();
    server.use(http.put('*/api/site-settings/pages', () => fail(500, 'Could not save')));

    await userEvent.setup().click(await screen.findByRole('switch', { name: 'Show Pricing' }));

    expect(await screen.findByText('Could not save')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Show Pricing' })).toBeChecked();
  });

  it.each<UserRole>(['Admin', 'Moderator', 'Teacher', 'Student'])(
    'sends a %s away: only a Super Admin manages pages',
    async (role) => {
      renderPage([], role);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalled();
      });
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    },
  );
});
