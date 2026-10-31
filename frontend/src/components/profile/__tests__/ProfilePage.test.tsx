import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { enrollmentsReturn, makeEnrolledCourse } from '@/components/student/__tests__/fixtures';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { ProfilePage } from '../ProfilePage';

import { makeProfile, planConfigsReturn, profileReturns, runningPlan } from './fixtures';

const renderPage = () =>
  renderWithProviders(
    <ConfirmProvider>
      <ProfilePage />
    </ConfirmProvider>,
  );

/** Endpoints a role may not use; each test checks none was called. */
let unexpected: string[] = [];
const forbidden = (path: string) =>
  http.get(path, () => {
    unexpected.push(path);
    return fail(403, 'Forbidden');
  });

describe('ProfilePage', () => {
  beforeEach(() => {
    unexpected = [];
  });
  afterEach(() => {
    expect(unexpected).toEqual([]);
  });

  it('shows a student their account, enrolments, purchases and running plan', async () => {
    server.use(
      profileReturns(
        makeProfile('Student', {
          name: 'Asha Rahman',
          email: 'asha@example.com',
          purchasedCourses: ['64b7f0c2a1b2c3d4e5f60a01'],
          activeSubscription: runningPlan('Premium'),
        }),
      ),
      enrollmentsReturn([makeEnrolledCourse(), makeEnrolledCourse(), makeEnrolledCourse()]),
      planConfigsReturn('Premium', 12, ['Live classes', 'Quiz bank']),
      forbidden('*/api/teachers/my-courses'),
    );
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Asha Rahman' })).toBeInTheDocument();
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    expect(screen.getByText('Enrolled courses')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(await screen.findByText('12 courses')).toBeInTheDocument();
    expect(screen.getByText('Live classes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change Plan' })).toHaveAttribute('href', '/pricing');
    expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeInTheDocument();
  });

  it('cancels the subscription after confirmation', async () => {
    let cancelled = false;
    server.use(
      http.get('*/api/auth/me', () =>
        ok(
          makeProfile('Student', {
            activeSubscription: cancelled ? undefined : runningPlan('Basic'),
          }),
        ),
      ),
      enrollmentsReturn([]),
      planConfigsReturn('Basic', 4, []),
      http.delete('*/api/subscriptions/cancel-my', () => {
        cancelled = true;
        return ok(undefined);
      }),
    );
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cancel Subscription' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel Subscription' });
    expect(dialog).toHaveTextContent('Are you sure you want to cancel your Basic subscription?');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel Subscription' }));

    expect(await screen.findByText('Subscription cancelled')).toBeInTheDocument();
    expect(cancelled).toBe(true);
    expect(await screen.findByText('You do not have an active subscription.')).toBeInTheDocument();
  });

  it('shows a teacher their assigned courses and no subscription card', async () => {
    server.use(
      profileReturns(makeProfile('Teacher')),
      http.get('*/api/teachers/my-courses', () =>
        ok(
          [
            { _id: 'a', title: 'Algebra' },
            { _id: 'b', title: 'Physics' },
          ],
          { total: 2 },
        ),
      ),
      forbidden('*/api/enrollments'),
    );
    renderPage();

    expect(await screen.findByText('Assigned courses')).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('Teaching access')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel Subscription' })).not.toBeInTheDocument();
    expect(screen.queryByText('You do not have an active subscription.')).not.toBeInTheDocument();
  });

  it('asks nothing role-specific for an admin', async () => {
    server.use(
      profileReturns(makeProfile('Admin')),
      forbidden('*/api/enrollments'),
      forbidden('*/api/teachers/my-courses'),
    );
    renderPage();

    expect(await screen.findByText('Management access')).toBeInTheDocument();
    expect(
      screen.getAllByText('Administrative account with platform management access.').length,
    ).toBeGreaterThan(0);
  });

  it('shows the server message when the profile cannot load', async () => {
    server.use(http.get('*/api/auth/me', () => fail(500, 'Database unavailable')));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Edit Profile' })).not.toBeInTheDocument();
    });
  });
});
