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
  COURSE_ID,
  makeOverview,
  makePerformanceCourses,
  performanceCoursesReturn,
  stubResizeObserver,
} from './fixtures';

/** Answers the overview and records the query string of every request. */
const overviewReturns = (overview = makeOverview()) => {
  const queries: string[] = [];
  const handler = http.get('*/api/performance/overview', ({ request }) => {
    queries.push(new URL(request.url).search);
    return ok(overview);
  });
  return { handler, queries };
};

describe('PerformancePage', () => {
  beforeEach(() => {
    stubResizeObserver();
    setLocation('/admin/performance');
    server.use(performanceCoursesReturn(makePerformanceCourses()));
  });

  it('shows all courses for the last 30 days by default', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    renderWithProviders(<PerformancePage />);

    expect(await screen.findByText('৳180')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('৳255 total revenue')).toBeInTheDocument();
    expect(screen.getByText('6 total enrollments')).toBeInTheDocument();
    expect(screen.getByText('4 paid · 1 free · 1 subscription')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Choose a course (now: All courses)' }),
    ).toBeVisible();
    expect(queries[0]).toBe('?courseId=all&dateRange=30d');
  });

  it('reads the course and range from the address and ignores bad values', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    setLocation('/admin/performance', `?course=${COURSE_ID}&range=7d&chart=bogus`);
    renderWithProviders(<PerformancePage />);

    expect(
      await screen.findByRole('button', { name: 'Choose a course (now: Algebra 101)' }),
    ).toBeInTheDocument();
    expect(queries[0]).toBe(`?courseId=${COURSE_ID}&dateRange=7d`);
    expect(screen.getByRole('button', { name: 'Line chart' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('never sends an unknown date range or course id to the server', async () => {
    const { handler, queries } = overviewReturns();
    server.use(handler);
    setLocation('/admin/performance', '?course={"$gt":""}&range=forever');
    renderWithProviders(<PerformancePage />);

    expect(await screen.findByText('৳180')).toBeInTheDocument();
    expect(queries[0]).toBe('?courseId=all&dateRange=30d');
  });

  it('keeps the range, metric and chart choices in the address', async () => {
    const user = userEvent.setup();
    server.use(overviewReturns().handler);
    renderWithProviders(<PerformancePage />);
    await screen.findByText('৳180');

    await user.click(screen.getByRole('combobox', { name: 'Date range' }));
    await user.click(screen.getByRole('option', { name: 'Lifetime' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/performance?range=lifetime', {
      scroll: false,
    });

    await user.click(screen.getByRole('combobox', { name: 'Metric' }));
    await user.click(screen.getByRole('option', { name: 'Enrollments' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/performance?metric=enrollments', {
      scroll: false,
    });

    await user.click(screen.getByRole('button', { name: 'Pie chart' }));
    expect(router.replace).toHaveBeenLastCalledWith('/admin/performance?chart=pie', {
      scroll: false,
    });
  });

  it('picks a course from the side panel, with a title search', async () => {
    const user = userEvent.setup();
    server.use(overviewReturns().handler);
    renderWithProviders(<PerformancePage />);

    await user.click(await screen.findByRole('button', { name: /Choose a course/ }));
    const list = await screen.findByRole('list', { name: 'Courses' });
    expect(within(list).getByText('Physics Draft')).toBeInTheDocument();
    expect(within(list).getByText('Unpublished')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search for a keyword' }), 'algebra');
    expect(within(list).queryByText('Physics Draft')).not.toBeInTheDocument();
    await user.click(within(list).getByText('Algebra 101'));
    expect(router.replace).toHaveBeenLastCalledWith(`/admin/performance?course=${COURSE_ID}`, {
      scroll: false,
    });
  });

  it('says so when the search matches no course', async () => {
    const user = userEvent.setup();
    server.use(overviewReturns().handler);
    renderWithProviders(<PerformancePage />);

    await user.click(await screen.findByRole('button', { name: /Choose a course/ }));
    await user.type(await screen.findByRole('textbox', { name: 'Search for a keyword' }), 'zzz');
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

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid date range');
  });
});
