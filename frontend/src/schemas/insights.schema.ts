import { z } from 'zod';

import { enrollmentTypeSchema } from './catalog.schema';

// Super Admin insights: GET /api/dashboard/summary and the /api/performance reads.

const labelCountSchema = z.object({ label: z.string(), value: z.number() });
export type LabelCount = z.infer<typeof labelCountSchema>;

const dashboardTotalsSchema = z.object({
  users: z.number(),
  students: z.number(),
  teachers: z.number(),
  courses: z.number(),
  publishedCourses: z.number(),
  draftCourses: z.number(),
  categories: z.number(),
  enrollments: z.number(),
  thisMonthEnrollments: z.number(),
  activeSubscriptions: z.number(),
  openQuestions: z.number(),
  totalRevenue: z.number(),
  thisMonthRevenue: z.number(),
  courseRevenue: z.number(),
  subscriptionRevenue: z.number(),
});
export type DashboardTotals = z.infer<typeof dashboardTotalsSchema>;

const timelineEntrySchema = z.object({
  /** "month/day" in server time */
  date: z.string(),
  enrollments: z.number(),
  courseRevenue: z.number(),
  subscriptionRevenue: z.number(),
  totalRevenue: z.number(),
});
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

const topCourseSchema = z.object({
  /** null when the course was deleted */
  course: z
    .object({
      _id: z.string(),
      title: z.string(),
      coverImage: z.string().nullish(),
      status: z.string().nullish(),
    })
    .nullable(),
  enrollments: z.number(),
});
export type TopCourse = z.infer<typeof topCourseSchema>;

const recentEnrollmentSchema = z.object({
  _id: z.string(),
  student: z.object({ name: z.string() }).nullable(),
  course: z.object({ title: z.string() }).nullable(),
  enrollmentType: enrollmentTypeSchema,
  createdAt: z.string(),
});
export type RecentEnrollment = z.infer<typeof recentEnrollmentSchema>;

/** GET /api/dashboard/summary (Super Admin). */
export const dashboardSummarySchema = z.object({
  totals: dashboardTotalsSchema,
  roleCounts: z.array(labelCountSchema),
  courseStatusCounts: z.array(labelCountSchema),
  coursePricingCounts: z.array(labelCountSchema),
  revenueTimeline: z.array(timelineEntrySchema),
  topCourses: z.array(topCourseSchema),
  recentEnrollments: z.array(recentEnrollmentSchema),
});
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

/** The only ranges GET /api/performance/overview accepts (anything else is a 400). */
export const DATE_RANGES = ['7d', '30d', 'lifetime'] as const;
export const dateRangeSchema = z.enum(DATE_RANGES);
export type DateRange = z.infer<typeof dateRangeSchema>;

const performancePointSchema = z.object({
  /** "month/day" for 7d/30d, "YYYY-MM" for lifetime */
  date: z.string(),
  revenue: z.number(),
  enrollments: z.number(),
});
export type PerformancePoint = z.infer<typeof performancePointSchema>;

/** GET /api/performance/overview?courseId=&dateRange= (Super Admin). */
export const performanceOverviewSchema = z.object({
  thisMonthRevenue: z.number(),
  totalRevenue: z.number(),
  thisMonthCount: z.number(),
  totalEnrollments: z.number(),
  chartData: z.array(performancePointSchema),
  breakdown: z.object({ free: z.number(), paid: z.number(), subscription: z.number() }),
});
export type PerformanceOverview = z.infer<typeof performanceOverviewSchema>;

/** One item of GET /api/performance/courses (title, cover, price fields and status only). */
export const performanceCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  status: z.enum(['Draft', 'Published']),
});
export type PerformanceCourse = z.infer<typeof performanceCourseSchema>;
