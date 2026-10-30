import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { PublicLayout } from '../PublicLayout';

import { publicChromeHandlers } from './public-fixtures';

const IN_TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const renderLayout = () => {
  server.use(...publicChromeHandlers);
  return renderWithProviders(<PublicLayout>page content</PublicLayout>);
};

describe('PublicLayout', () => {
  it('shows the page between the navbar and the footer, with every public link', () => {
    renderLayout();

    expect(screen.getByRole('main')).toHaveTextContent('page content');
    const nav = screen.getByRole('navigation', { name: 'Site menu' });
    for (const name of [
      'All Courses',
      'Free Courses',
      'Pricing',
      'Teachers',
      'Practice Quiz',
      'Community Hub',
    ]) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('link', { name: 'Practice Quiz' })).toHaveAttribute(
      'href',
      '/practice-quiz',
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent('MedhaBee E-Learning Platform');
  });

  it('offers Sign In and Sign Up to visitors', async () => {
    renderLayout();

    expect(await screen.findByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/auth/login',
    );
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/auth/register');
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it("shows a signed-in user's dashboard link instead of the sign-in buttons", async () => {
    server.use(signedInAs(makeUser('Teacher')));
    renderLayout();

    expect(await screen.findByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/teacher/courses',
    );
    expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument();
  });

  it('searches the catalog from the navbar', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.type(screen.getByRole('searchbox', { name: 'Search courses' }), 'react{Enter}');

    expect(router.push).toHaveBeenCalledWith('/courses?search=react');
  });

  it('shows the app name when no logo was uploaded', () => {
    renderLayout();

    const home = screen.getByRole('link', { name: 'MedhaBee home' });
    expect(home).toHaveAttribute('href', '/');
    expect(within(home).getByText('MedhaBee')).toBeInTheDocument();
  });

  it('shows the discount banner with a countdown while an offer runs', async () => {
    server.use(...publicChromeHandlers);
    server.use(
      http.get('*/api/courses/discounts/active', () =>
        ok({
          courseCount: 3,
          discountPercent: 40,
          discountEndsAt: new Date(Date.now() + IN_TWO_DAYS_MS).toISOString(),
        }),
      ),
    );
    renderWithProviders(<PublicLayout>page</PublicLayout>);

    const banner = await screen.findByRole('complementary', {
      name: 'Limited-time course discount is live',
    });
    expect(within(banner).getByText('Up to 40% off')).toBeInTheDocument();
    expect(within(banner).getByText('3 courses included in this offer')).toBeInTheDocument();
    expect(within(banner).getByRole('timer')).toHaveTextContent(/1d 23h/);
    expect(within(banner).getByRole('link', { name: 'View discounted courses' })).toHaveAttribute(
      'href',
      '/courses',
    );
  });

  it('has no banner when no discount runs', async () => {
    renderLayout();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
