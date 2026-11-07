import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { PerformancePage } from '../performance/PerformancePage';

import {
  COURSE_2_ID,
  COURSE_ID,
  makeOverview,
  makePerformanceCourses,
  performanceCoursesReturn,
  stubResizeObserver,
} from './fixtures';

const VIEWER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Answers the overview and records the query of every request. */
const overviewReturns = (overview = makeOverview()) => {
  const queries: URLSearchParams[] = [];
  const handler = http.get('*/api/performance/overview', ({ request }) => {
    queries.push(new URL(request.url).searchParams);
    return ok(overview);
  });
  return { handler, queries };
};

const asObject = (query: URLSearchParams | undefined) => Object.fromEntries(query ?? []);

describe('PerformancePage', () => {
  beforeEach(() => {
    stubResizeObserver();
    setLocation('/admin/performance');
    server.use(performanceCoursesReturn(makePerformanceCourses()));
  });

  it('shows revenue for today, the last 7 days, this month and all time for all courses', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    renderWithProviders(<PerformancePage />);

    const cards = await screen.findByRole('region', { name: 'Revenue per period' });
    expect(await within(cards).findByText('৳80')).toBeInTheDocument();
    const periods: [string, string][] = [
      ['Today', '৳80'],
      ['Last 7 days', '৳130'],
      ['This month', '৳180'],
      ['All time', '৳255'],
    ];
    for (const [label, amount] of periods) {
      expect(within(cards).getByText(label)).toBeInTheDocument();
      expect(within(cards).getByText(amount)).toBeInTheDocument();
    }
    expect(within(cards).getByText('6 enrollments · 4 paid')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days: ৳180 · 3 enrollments (2 paid)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose courses (now: All courses)' })).toBeVisible();
    expect(asObject(queries[0])).toEqual({ courseIds: 'all', dateRange: '30d', tz: VIEWER_ZONE });
  });

  it('reads the courses and range from the address and ignores bad values', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    setLocation('/admin/performance', `?courses=${COURSE_ID},nope&range=7d&chart=bogus`);
    renderWithProviders(<PerformancePage />);

    expect(
      await screen.findByRole('button', { name: 'Choose courses (now: Algebra 101)' }),
    ).toBeInTheDocument();
    expect(asObject(queries[0])).toMatchObject({ courseIds: COURSE_ID, dateRange: '7d' });
    expect(screen.getByRole('button', { name: 'Line chart' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('never sends an unknown date range or course id to the server', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    setLocation('/admin/performance', '?courses={"$gt":""}&range=forever');
    renderWithProviders(<PerformancePage />);

    await screen.findByRole('region', { name: 'Revenue per period' });
    expect(asObject(queries[0])).toMatchObject({ courseIds: 'all', dateRange: '30d' });
  });

  it('a custom range waits for both days, then sends them', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    setLocation('/admin/performance', '?range=custom&from=2026-10-01');
    const { unmount } = renderWithProviders(<PerformancePage />);

    expect(
      await screen.findByText('Choose a start date and an end date to see the chart.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-10-01');
    expect(queries).toHaveLength(0);
    unmount();

    setLocation('/admin/performance', '?range=custom&from=2026-10-01&to=2026-10-15');
    renderWithProviders(<PerformancePage />);
    await screen.findByText(/Custom range: ৳180/);
    expect(asObject(queries[0])).toMatchObject({
      dateRange: 'custom',
      from: '2026-10-01',
      to: '2026-10-15',
    });
  });

  it('marks an end date before the start date', async () => {
    server.use(overviewReturns().handler);
    setLocation('/admin/performance', '?range=custom&from=2026-10-10&to=2026-10-01');
    renderWithProviders(<PerformancePage />);

    expect(
      await screen.findByText('The end date must be on or after the start date'),
    ).toBeInTheDocument();
  });

  it('keeps the range, metric and chart choices in the address', async () => {
    const user = userEvent.setup();
    server.use(overviewReturns().handler);
    renderWithProviders(<PerformancePage />);
    await screen.findByRole('region', { name: 'Revenue per period' });

    await user.click(screen.getByRole('combobox', { name: 'Date range' }));
    for (const option of ['Today', 'Last 7 days', 'This month', 'All time', 'Custom range']) {
      expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('option', { name: 'This month' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/performance?range=month', {
      scroll: false,
    });

    await user.click(screen.getByRole('combobox', { name: 'Metric' }));
    await user.click(screen.getByRole('option', { name: 'Paid enrollments' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/performance?metric=paidEnrollments', {
      scroll: false,
    });

    await user.click(screen.getByRole('button', { name: 'Pie chart' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/performance?chart=pie', {
      scroll: false,
    });
  });

  it('picks several courses in the side panel (cover, title, paid students) and applies them', async () => {
    const user = userEvent.setup();
    server.use(overviewReturns().handler);
    renderWithProviders(<PerformancePage />);

    await user.click(await screen.findByRole('button', { name: /Choose courses/ }));
    const list = await screen.findByRole('list', { name: 'Courses' });
    expect(within(list).getByText('Physics Draft')).toBeInTheDocument();
    expect(within(list).getByText('Unpublished')).toBeInTheDocument();
    expect(within(list).getByText('12 paid students')).toBeInTheDocument();
    expect(within(list).getByRole('checkbox', { name: 'All courses' })).toBeChecked();

    await user.click(within(list).getByRole('checkbox', { name: 'Algebra 101' }));
    await user.click(within(list).getByRole('checkbox', { name: 'Physics Draft' }));
    expect(within(list).getByRole('checkbox', { name: 'All courses' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Apply (2 courses)' }));
    expect(router.replace).toHaveBeenLastCalledWith(
      `/admin/performance?courses=${COURSE_ID}%2C${COURSE_2_ID}`,
      { scroll: false },
    );
  });

  it('shows "2 courses" for a multi-course selection and sends every id', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    setLocation('/admin/performance', `?courses=${COURSE_ID},${COURSE_2_ID}`);
    renderWithProviders(<PerformancePage />);

    expect(
      await screen.findByRole('button', { name: 'Choose courses (now: 2 courses)' }),
    ).toBeInTheDocument();
    expect(asObject(queries[0])).toMatchObject({ courseIds: `${COURSE_ID},${COURSE_2_ID}` });
  });

  it('filters the panel by title and says so when nothing matches', async () => {
    const user = userEvent.setup();
    server.use(overviewReturns().handler);
    renderWithProviders(<PerformancePage />);

    await user.click(await screen.findByRole('button', { name: /Choose courses/ }));
    const search = await screen.findByRole('textbox', { name: 'Search for a keyword' });
    await user.type(search, 'algebra');
    const list = screen.getByRole('list', { name: 'Courses' });
    expect(within(list).queryByText('Physics Draft')).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'zzz');
    expect(screen.getByText('No courses match your search.')).toBeInTheDocument();
  });

  it('shows an empty chart message when the range has no data', async () => {
    server.use(overviewReturns(makeOverview({ chartData: [] })).handler);
    renderWithProviders(<PerformancePage />);

    expect(await screen.findByText('No data for the selected range.')).toBeInTheDocument();
  });

  it('shows the server message when the report cannot load', async () => {
    server.use(http.get('*/api/performance/overview', () => fail(400, 'Invalid date range')));
    renderWithProviders(<PerformancePage />);

    expect(await screen.findByText('Invalid date range')).toBeInTheDocument();
  });
});
