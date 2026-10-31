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

export const makeSummary = (overrides: Partial<DashboardSummary> = {}): DashboardSummary =>
  dashboardSummarySchema.parse({
    totals: {
      users: 7,
      students: 3,
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
    roleCounts: [
      { label: 'Student', value: 3 },
      { label: 'Teacher', value: 1 },
    ],
    courseStatusCounts: [{ label: 'Published', value: 2 }],
    coursePricingCounts: [{ label: 'Paid', value: 2 }],
    revenueTimeline: [
      {
        date: '10/29',
        enrollments: 2,
        courseRevenue: 350,
        subscriptionRevenue: 100,
        totalRevenue: 450,
      },
    ],
    topCourses: [
      { course: { _id: COURSE_ID, title: 'Algebra 101', status: 'Published' }, enrollments: 3 },
      { course: null, enrollments: 1 },
    ],
    recentEnrollments: [
      {
        _id: '64b7f0c2a1b2c3d4e5f74001',
        student: { name: 'Asha Karim' },
        course: { title: 'Algebra 101' },
        enrollmentType: 'paid',
        createdAt: '2026-10-29T10:00:00.000Z',
      },
    ],
    ...overrides,
  });

export const summaryReturns = (summary: DashboardSummary) =>
  http.get('*/api/dashboard/summary', () => ok(summary));

export const makeOverview = (overrides: Partial<PerformanceOverview> = {}): PerformanceOverview =>
  performanceOverviewSchema.parse({
    thisMonthRevenue: 180,
    totalRevenue: 255,
    thisMonthCount: 4,
    totalEnrollments: 6,
    chartData: [{ date: '10/29', revenue: 180, enrollments: 3 }],
    breakdown: { free: 1, paid: 4, subscription: 1 },
    ...overrides,
  });

export const makePerformanceCourses = (): PerformanceCourse[] =>
  [
    { _id: COURSE_ID, title: 'Algebra 101', status: 'Published' },
    { _id: '64b7f0c2a1b2c3d4e5f73002', title: 'Physics Draft', status: 'Draft' },
  ].map((course) => performanceCourseSchema.parse(course));

export const performanceCoursesReturn = (courses: PerformanceCourse[]) =>
  http.get('*/api/performance/courses', () => ok(courses));
