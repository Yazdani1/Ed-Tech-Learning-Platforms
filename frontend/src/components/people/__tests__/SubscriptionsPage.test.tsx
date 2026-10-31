import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { toDateInput } from '@/utils/dateTime';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage';

import { makeManagedUser, makePlan, makeSubscription, usersHandler } from './people-fixtures';

import type { SubscriptionRecord } from '@/schemas/people.schema';
import type { UserRole } from '@/types';

const PREMIUM = makePlan('0601', 'Premium', 500);
const ACTIVE = makeSubscription('0701', 'Active');
const CANCELLED = makeSubscription('0702', 'Cancelled');
const ASHA = makeManagedUser('9001', 'Asha Rahman');
const DAY_MS = 86_400_000;

const membersEnvelope = (records: SubscriptionRecord[]) => ({
  total: records.length,
  pagination: { page: 1, limit: 10, total: records.length, totalPages: 1 },
  statusCounts: { active: 1, cancelled: 1, expired: 0, all: 2 },
});

const renderPage = (role: UserRole = 'Admin', search = '') => {
  setLocation('/admin/subscriptions', search);
  server.use(
    signedInAs(makeUser(role)),
    http.get('*/api/subscription-plans', () => ok([PREMIUM])),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <SubscriptionsPage />
    </ConfirmProvider>,
  );
};

const user = () => userEvent.setup();

describe('SubscriptionsPage', () => {
  it('shows the plans with billing options and features', async () => {
    renderPage();

    const card = await screen.findByRole('article', { name: 'Premium' });
    expect(within(card).getByText('2 billing options')).toBeInTheDocument();
    expect(within(card).getByText('Yearly')).toBeInTheDocument();
    expect(within(card).getByText('৳5,000')).toBeInTheDocument();
    expect(within(card).getByText('All courses')).toBeInTheDocument();
  });

  it('shows the plan list error', async () => {
    setLocation('/admin/subscriptions');
    server.use(
      signedInAs(makeUser('Admin')),
      http.get('*/api/subscription-plans', () => fail(500, 'Plans failed')),
    );
    renderWithProviders(
      <ConfirmProvider>
        <SubscriptionsPage />
      </ConfirmProvider>,
    );
    expect(await screen.findByText('Plans failed')).toBeInTheDocument();
  });

  it('adds a plan with numbers and without empty features', async () => {
    let body: unknown;
    server.use(
      http.post('*/api/subscription-plans', async ({ request }) => {
        body = await request.json();
        return ok(PREMIUM);
      }),
    );
    renderPage();

    await user().click(await screen.findByRole('button', { name: 'Add Plan' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Subscription Plan' });
    await user().type(within(dialog).getByLabelText(/Plan name/), 'Gold');
    const option = within(dialog).getByRole('group', { name: 'Billing option 1' });
    await user().click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(option).findByText('This field is required')).toBeInTheDocument();

    await user().type(within(option).getByLabelText('Price (BDT)'), '900');
    await user().type(within(dialog).getByLabelText('Feature 1'), 'Live classes');
    await user().click(within(dialog).getByRole('button', { name: 'Add Feature' }));
    await user().click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Plan saved')).toBeInTheDocument();
    expect(body).toEqual({
      plan: 'Gold',
      billingOptions: [{ label: 'Monthly', duration: 1, price: 900 }],
      features: ['Live classes'],
    });
  });

  it('deletes a plan after confirmation', async () => {
    let deleted = '';
    server.use(
      http.delete('*/api/subscription-plans/:id', ({ params }) => {
        deleted = String(params.id);
        return ok(undefined);
      }),
    );
    renderPage();

    await user().click(await screen.findByRole('button', { name: 'Delete plan Premium' }));
    await user().click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    expect(await screen.findByText('Plan deleted')).toBeInTheDocument();
    expect(deleted).toBe(PREMIUM._id);
  });

  it('lists members with status counts and cancels an active one', async () => {
    let cancelled = '';
    let query = '';
    server.use(
      http.get('*/api/subscriptions', ({ request }) => {
        query = new URL(request.url).search;
        return ok([ACTIVE, CANCELLED], membersEnvelope([ACTIVE, CANCELLED]));
      }),
      http.patch('*/api/subscriptions/:id/cancel', ({ params }) => {
        cancelled = String(params.id);
        return ok(undefined);
      }),
    );
    renderPage('Admin', '?tab=members');

    expect(await screen.findByRole('tab', { name: 'Active Members (1)' })).toBeInTheDocument();
    expect(query).toContain('status=active');
    expect(await screen.findAllByText('Asha Rahman')).toHaveLength(2);
    // Only the active record can be cancelled
    await user().click(
      screen.getByRole('button', { name: 'Cancel the subscription of Asha Rahman' }),
    );
    await user().click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Cancel Subscription',
      }),
    );
    expect(await screen.findByText('Subscription cancelled')).toBeInTheDocument();
    expect(cancelled).toBe(ACTIVE._id);
  });

  it('shows the empty member view', async () => {
    server.use(http.get('*/api/subscriptions', () => ok([], membersEnvelope([]))));
    renderPage('Admin', '?tab=members&status=expired');
    expect(await screen.findByText('No subscriptions match this view.')).toBeInTheDocument();
  });

  it('assigns a plan to a user found by search until a future date', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.get('*/api/subscriptions', () => ok([], membersEnvelope([]))),
      usersHandler([ASHA]),
      http.post('*/api/subscriptions/assign', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return ok(ACTIVE);
      }),
    );
    renderPage('Admin', '?tab=members');

    await user().click(await screen.findByRole('button', { name: 'Assign Subscription' }));
    const dialog = await screen.findByRole('dialog', { name: 'Assign Subscription' });
    await user().click(within(dialog).getByRole('button', { name: 'Assign' }));
    expect(await within(dialog).findAllByText('This field is required')).not.toHaveLength(0);

    await user().type(within(dialog).getByRole('combobox', { name: /User/ }), 'Asha');
    await user().click(await screen.findByRole('option', { name: /Asha Rahman/ }));
    const future = toDateInput(new Date(Date.now() + 10 * DAY_MS));
    await user().type(within(dialog).getByLabelText(/End Date/), future);
    await user().click(within(dialog).getByRole('button', { name: 'Assign' }));

    expect(await screen.findByText('Subscription assigned')).toBeInTheDocument();
    expect(body.userId).toBe(ASHA._id);
    expect(body.plan).toBe('Premium');
    expect(body.billingDuration).toBe(1);
    expect(new Date(String(body.endDate)).getTime()).toBeGreaterThan(Date.now());
  });

  it('sends a Moderator away', async () => {
    renderPage('Moderator');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
  });
});
