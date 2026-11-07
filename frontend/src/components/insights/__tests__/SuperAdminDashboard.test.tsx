import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { SuperAdminDashboard } from '../dashboard/SuperAdminDashboard';

import { makeSummary, stubResizeObserver, summaryReturns } from './fixtures';

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    stubResizeObserver();
    server.use(signedInAs(makeUser('Super Admin', { name: 'Nadia' })));
  });

  it('shows revenue for today, the last 7 days, this month and all time, each on its own card', async () => {
    server.use(summaryReturns(makeSummary()));
    renderWithProviders(<SuperAdminDashboard />);

    const cards = await screen.findByRole('region', { name: 'Revenue' });
    const periods: [string, string][] = [
      ['Today', '৳120'],
      ['Last 7 days', '৳300'],
      ['This month', '৳450'],
      ['All time', '৳1,530'],
    ];
    for (const [label, amount] of periods) {
      expect(within(cards).getByText(label)).toBeInTheDocument();
      expect(within(cards).getByText(amount)).toBeInTheDocument();
    }
    expect(within(cards).getByText('Courses ৳390 · Subscriptions ৳1,140')).toBeInTheDocument();
    expect(within(cards).getByText('5 enrollments (3 paid)')).toBeInTheDocument();
  });

  it('shows the student count and the other platform numbers', async () => {
    server.use(summaryReturns(makeSummary()));
    renderWithProviders(<SuperAdminDashboard />);

    const counts = await screen.findByRole('region', { name: 'Platform numbers' });
    expect(within(counts).getByText('Students')).toBeInTheDocument();
    expect(within(counts).getByText('2 new this month')).toBeInTheDocument();
    expect(within(counts).getByText('2 published, 1 draft')).toBeInTheDocument();
    // No subtitle under the title any more (same page header everywhere)
    expect(screen.queryByText(/Welcome back, Nadia/)).not.toBeInTheDocument();
  });

  it('lists the top 5 courses with their revenue and enrolled students; no recent enrolments', async () => {
    server.use(summaryReturns(makeSummary()));
    renderWithProviders(<SuperAdminDashboard />);

    const top = await screen.findByRole('region', { name: 'Top 5 courses by revenue' });
    expect(within(top).getByText('Algebra 101')).toBeInTheDocument();
    expect(within(top).getByText('৳350')).toBeInTheDocument();
    expect(within(top).getByText('3 students enrolled (2 paid)')).toBeInTheDocument();
    expect(within(top).getByText('Deleted course')).toBeInTheDocument();
    expect(screen.queryByText(/recent enrollments/i)).not.toBeInTheDocument();
  });

  it('says so when nobody has enrolled yet', async () => {
    server.use(summaryReturns(makeSummary({ topCourses: [] })));
    renderWithProviders(<SuperAdminDashboard />);

    expect(await screen.findByText('No enrollments yet.')).toBeInTheDocument();
  });

  it('sends the viewer time zone with the request', async () => {
    let tz: string | null = null;
    server.use(
      http.get('*/api/dashboard/summary', ({ request }) => {
        tz = new URL(request.url).searchParams.get('tz');
        return ok(makeSummary());
      }),
    );
    renderWithProviders(<SuperAdminDashboard />);

    await screen.findByRole('region', { name: 'Revenue' });
    expect(tz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('shows the server message when the summary cannot load', async () => {
    server.use(http.get('*/api/dashboard/summary', () => fail(403, 'Not allowed')));
    renderWithProviders(<SuperAdminDashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed');
  });
});
