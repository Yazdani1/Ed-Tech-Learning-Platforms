import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { fail, makeUser, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { SuperAdminDashboard } from '../dashboard/SuperAdminDashboard';

import { makeSummary, stubResizeObserver, summaryReturns } from './fixtures';

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    stubResizeObserver();
    server.use(signedInAs(makeUser('Super Admin', { name: 'Nadia' })));
  });

  it('shows the headline numbers, top courses and recent enrolments', async () => {
    server.use(summaryReturns(makeSummary()));
    renderWithProviders(<SuperAdminDashboard />);

    expect(await screen.findByText('৳1,530')).toBeInTheDocument();
    expect(
      await screen.findByText('Welcome back, Nadia. Here is the current application snapshot.'),
    ).toBeInTheDocument();
    expect(screen.getByText('৳450 this month')).toBeInTheDocument();
    expect(screen.getByText('4 enrollments this month')).toBeInTheDocument();
    expect(screen.getByText('2 published, 1 draft')).toBeInTheDocument();
    expect(screen.getByText('৳1,140 subscription revenue')).toBeInTheDocument();
    expect(screen.getByText('Unresolved Q&A')).toBeInTheDocument();
    expect(screen.getByText('5 total enrollments')).toBeInTheDocument();

    const top = screen.getByRole('region', { name: 'Top Courses' });
    expect(within(top).getByText('Algebra 101')).toBeInTheDocument();
    expect(within(top).getByText('3 enrollments')).toBeInTheDocument();
    expect(within(top).getByText('Deleted course')).toBeInTheDocument();

    const recent = screen.getByRole('list', { name: 'Recent Enrollments' });
    expect(within(recent).getByText('Asha Karim')).toBeInTheDocument();
    expect(within(recent).getByText('Paid')).toBeInTheDocument();
  });

  it('says so when nobody has enrolled yet', async () => {
    server.use(summaryReturns(makeSummary({ topCourses: [], recentEnrollments: [] })));
    renderWithProviders(<SuperAdminDashboard />);

    expect(await screen.findAllByText('No enrollments yet.')).toHaveLength(2);
  });

  it('shows the server message when the summary cannot load', async () => {
    server.use(http.get('*/api/dashboard/summary', () => fail(403, 'Not allowed')));
    renderWithProviders(<SuperAdminDashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed');
  });
});
