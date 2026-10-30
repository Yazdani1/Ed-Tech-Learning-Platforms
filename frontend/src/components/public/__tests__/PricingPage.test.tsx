import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { PricingPage } from '../pricing/PricingPage';

import { browsePage, makeCourse, makePlan, makeSubscription } from './public-fixtures';

const premium = makePlan();
const basic = makePlan({
  _id: '680000000000000000000002',
  plan: 'Basic',
  badge: null,
  billingOptions: [{ label: 'Monthly', duration: 1, price: 200 }],
  courseCount: 0,
});

const planCard = async (name: string) => screen.findByRole('article', { name });

describe('PricingPage', () => {
  beforeEach(() => {
    server.use(http.get('*/api/subscription-plans', () => ok([basic, premium])));
  });

  it('shows every plan with its monthly price and features', async () => {
    renderWithProviders(<PricingPage />);

    const card = await planCard('Premium');
    expect(within(card).getByText('BDT 500')).toBeInTheDocument();
    expect(within(card).getByText('for 1 month')).toBeInTheDocument();
    expect(within(card).getByText('Quiz bank')).toBeInTheDocument();
    expect(within(card).getByText('Popular')).toBeInTheDocument();
    expect(within(card).getByText('2 courses included free')).toBeInTheDocument();
  });

  it('switches the billing period and shows the saving', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingPage />);

    await user.click(await screen.findByRole('button', { name: 'Yearly' }));

    const card = await planCard('Premium');
    expect(within(card).getByText('BDT 4,800')).toBeInTheDocument();
    expect(within(card).getByText('Save BDT 1,200 (20%)')).toBeInTheDocument();
    const basicCard = await planCard('Basic');
    expect(within(basicCard).getByRole('button', { name: 'Not Available' })).toBeDisabled();
  });

  it('sends guests to sign in and back to /pricing', async () => {
    renderWithProviders(<PricingPage />);

    const card = await planCard('Premium');
    expect(await within(card).findByRole('link', { name: 'Get Started' })).toHaveAttribute(
      'href',
      '/auth/login?next=%2Fpricing',
    );
    expect(
      await screen.findByRole('heading', { name: 'Already have an account?' }),
    ).toBeInTheDocument();
  });

  it('lets a Student subscribe (the request carries only the plan and period)', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/subscriptions/my', () => ok(null)),
      http.post('*/api/subscriptions/subscribe', async ({ request }) => {
        body = await request.json();
        return ok(makeSubscription());
      }),
    );
    renderWithProviders(<PricingPage />);

    const card = await planCard('Premium');
    await user.click(await within(card).findByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Subscribed to Premium plan!')).toBeInTheDocument();
    expect(body).toEqual({ plan: 'Premium', billingDuration: 1 });
    expect(await within(card).findByRole('button', { name: 'Active Plan' })).toBeDisabled();
    expect(within(card).getByText('Current Plan')).toBeInTheDocument();
  });

  it('shows the backend error when subscribing fails', async () => {
    const user = userEvent.setup();
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/subscriptions/my', () => ok(null)),
      http.post('*/api/subscriptions/subscribe', () =>
        fail(404, 'Subscription plan not available'),
      ),
    );
    renderWithProviders(<PricingPage />);

    await user.click(
      await within(await planCard('Basic')).findByRole('button', { name: 'Subscribe' }),
    );

    expect(await screen.findByText('Subscription plan not available')).toBeInTheDocument();
  });

  it("shows a Student's running plan and offers to switch the others", async () => {
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/subscriptions/my', () => ok(makeSubscription())),
    );
    renderWithProviders(<PricingPage />);

    expect(await screen.findByText(/Current plan: Premium - Expires/)).toBeInTheDocument();
    expect(
      await within(await planCard('Basic')).findByRole('button', { name: 'Switch Plan' }),
    ).toBeEnabled();
  });

  it('does not offer subscribing to staff (only Students may)', async () => {
    let askedForSubscription = false;
    server.use(
      signedInAs(makeUser('Admin')),
      http.get('*/api/subscriptions/my', () => {
        askedForSubscription = true;
        return ok(null);
      }),
    );
    renderWithProviders(<PricingPage />);

    const card = await planCard('Premium');
    expect(
      await within(card).findByText('Only students can subscribe to plans'),
    ).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
    expect(askedForSubscription).toBe(false);
  });

  it('lists the courses included in a plan', async () => {
    const user = userEvent.setup();
    let plansParam: string | null = null;
    server.use(
      http.get('*/api/categories', () => ok([])),
      http.get('*/api/course-types', () => ok([])),
      http.get('*/api/courses/browse', ({ request }) => {
        plansParam = new URL(request.url).searchParams.get('subscriptionPlans');
        return browsePage([makeCourse()]);
      }),
    );
    renderWithProviders(<PricingPage />);

    await user.click(
      await within(await planCard('Premium')).findByRole('button', {
        name: 'View Included Courses (2)',
      }),
    );

    const dialog = await screen.findByRole('dialog', { name: 'Premium included courses' });
    expect(
      await within(dialog).findByRole('link', { name: /TypeScript Basics/ }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('1 course included')).toBeInTheDocument();
    expect(plansParam).toBe('Premium');
  });

  it('says when there are no plans', async () => {
    server.use(http.get('*/api/subscription-plans', () => ok([])));
    renderWithProviders(<PricingPage />);

    expect(
      await screen.findByText('No subscription plans available yet. Check back soon!'),
    ).toBeInTheDocument();
  });

  it('shows the error when plans cannot load', async () => {
    server.use(http.get('*/api/subscription-plans', () => fail(500, 'Server error')));
    renderWithProviders(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
