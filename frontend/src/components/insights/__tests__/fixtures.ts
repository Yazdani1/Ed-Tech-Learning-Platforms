import { http } from 'msw';
import { vi } from 'vitest';

import {
  dashboardSummarySchema,
  performanceCourseSchema,
  performanceOverviewSchema,
  type DashboardSummary,
  type PerformanceCourse,
  type PerformanceOverview,
} from '@/schemas/insights.schema';
import { ok } from '@/test/msw/handlers';

/** jsdom has no ResizeObserver (recharts' ResponsiveContainer needs one): a no-op stand-in. */
export const stubResizeObserver = (): void => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = (): undefined => undefined;
      unobserve = (): undefined => undefined;
      disconnect = (): undefined => undefined;
    },
  );
};

export const COURSE_ID = '64b7f0c2a1b2c3d4e5f73001';
export const COURSE_2_ID = '64b7f0c2a1b2c3d4e5f73002';

const period = (total: number, course: number, enrollments: number, paid: number) => ({
  total,
  course,
  subscription: total - course,
  enrollments,
  paidEnrollments: paid,
});

const timelineRow = (date: string, courseRevenue: number, subscriptionRevenue: number) => ({
  date,
  enrollments: 2,
  paidEnrollments: 1,
  courseRevenue,
  subscriptionRevenue,
  totalRevenue: courseRevenue + subscriptionRevenue,
});

export const makeSummary = (overrides: Partial<DashboardSummary> = {}): DashboardSummary =>
  dashboardSummarySchema.parse({
    totals: {
      users: 7,
      students: 3,
      newStudentsThisMonth: 2,
      teachers: 1,
      courses: 3,
      publishedCourses: 2,
      draftCourses: 1,
      categories: 4,
      enrollments: 5,
      thisMonthEnrollments: 4,
      activeSubscriptions: 1,
      openQuestions: 2,
      totalRevenue: 1530,
      thisMonthRevenue: 450,
      courseRevenue: 390,
      subscriptionRevenue: 1140,
    },
    revenue: {
      today: period(120, 100, 1, 1),
      week: period(300, 250, 3, 2),
      month: period(450, 350, 4, 2),
      lifetime: period(1530, 390, 5, 3),
    },
    revenueTimeline: [timelineRow('2026-10-29', 350, 100)],
    monthlyRevenue: [timelineRow('2026-10', 350, 100)],
    topCourses: [
      {
        course: { _id: COURSE_ID, title: 'Algebra 101', status: 'Published' },
        enrollments: 3,
        paidEnrollments: 2,
        revenue: 350,
      },
      { course: null, enrollments: 1, paidEnrollments: 1, revenue: 40 },
    ],
    ...overrides,
  });

export const summaryReturns = (summary: DashboardSummary) =>
  http.get('*/api/dashboard/summary', () => ok(summary));

const numbers = (revenue: number, enrollments: number, paid: number) => ({
  revenue,
  enrollments,
  paidEnrollments: paid,
});

export const makeOverview = (overrides: Partial<PerformanceOverview> = {}): PerformanceOverview =>
  performanceOverviewSchema.parse({
    thisMonthRevenue: 180,
    totalRevenue: 255,
    thisMonthCount: 4,
    totalEnrollments: 6,
    periods: {
      today: numbers(80, 1, 1),
      week: numbers(130, 2, 2),
      month: numbers(180, 4, 3),
      lifetime: numbers(255, 6, 4),
    },
    selected: { ...numbers(180, 3, 2), breakdown: { free: 1, paid: 2, subscription: 0 } },
    granularity: 'day',
    chartData: [{ date: '2026-10-29', revenue: 180, enrollments: 3, paidEnrollments: 2 }],
    breakdown: { free: 1, paid: 4, subscription: 1 },
    ...overrides,
  });

export const makePerformanceCourses = (): PerformanceCourse[] =>
  [
    { _id: COURSE_ID, title: 'Algebra 101', status: 'Published', paidStudents: 12 },
    { _id: COURSE_2_ID, title: 'Physics Draft', status: 'Draft', paidStudents: 0 },
  ].map((course) => performanceCourseSchema.parse(course));

export const performanceCoursesReturn = (courses: PerformanceCourse[]) =>
  http.get('*/api/performance/courses', () => ok(courses));
