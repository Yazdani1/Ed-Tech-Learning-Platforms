import { z } from 'zod';

// Super Admin insights: GET /api/dashboard/summary and the /api/performance reads.

/** One slice of a pie chart (label already translated). */
export interface LabelCount {
  label: string;
  value: number;
}

const dashboardTotalsSchema = z.object({
  users: z.number(),
  students: z.number(),
  newStudentsThisMonth: z.number(),
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

/** Revenue of one period (today, last 7 days, this month, lifetime): course + subscription. */
const revenuePeriodSchema = z.object({
  total: z.number(),
  course: z.number(),
  subscription: z.number(),
  enrollments: z.number(),
  paidEnrollments: z.number(),
});
export type RevenuePeriod = z.infer<typeof revenuePeriodSchema>;

/** The four headline periods (the server counts them in the viewer's time zone, sent as ?tz=). */
export const REVENUE_PERIODS = ['today', 'week', 'month', 'lifetime'] as const;
export type RevenuePeriodKey = (typeof REVENUE_PERIODS)[number];

const timelineEntrySchema = z.object({
  /** "yyyy-MM-dd" (days) or "yyyy-MM" (months) in the viewer's zone */
  date: z.string(),
  enrollments: z.number(),
  paidEnrollments: z.number(),
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
  paidEnrollments: z.number(),
  revenue: z.number(),
});
export type TopCourse = z.infer<typeof topCourseSchema>;

/** GET /api/dashboard/summary?tz= (Super Admin). */
export const dashboardSummarySchema = z.object({
  totals: dashboardTotalsSchema,
  revenue: z.object({
    today: revenuePeriodSchema,
    week: revenuePeriodSchema,
    month: revenuePeriodSchema,
    lifetime: revenuePeriodSchema,
  }),
  /** The last 30 days */
  revenueTimeline: z.array(timelineEntrySchema),
  /** The last 12 months */
  monthlyRevenue: z.array(timelineEntrySchema),
  topCourses: z.array(topCourseSchema),
});
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

/** The ranges GET /api/performance/overview accepts (custom needs from + to). */
export const DATE_RANGES = ['today', '7d', '30d', 'month', 'lifetime', 'custom'] as const;
export const dateRangeSchema = z.enum(DATE_RANGES);
export type DateRange = z.infer<typeof dateRangeSchema>;

export const GRANULARITIES = ['hour', 'day', 'month'] as const;
export type Granularity = (typeof GRANULARITIES)[number];

const performancePointSchema = z.object({
  /** "yyyy-MM-ddTHH" (hour), "yyyy-MM-dd" (day) or "yyyy-MM" (month), in the viewer's zone */
  date: z.string(),
  revenue: z.number(),
  enrollments: z.number(),
  paidEnrollments: z.number(),
});
export type PerformancePoint = z.infer<typeof performancePointSchema>;

const breakdownSchema = z.object({ free: z.number(), paid: z.number(), subscription: z.number() });

const periodNumbersSchema = z.object({
  revenue: z.number(),
  enrollments: z.number(),
  paidEnrollments: z.number(),
});
export type PeriodNumbers = z.infer<typeof periodNumbersSchema>;

/** GET /api/performance/overview?courseIds=&dateRange=&from=&to=&tz= (Super Admin). */
export const performanceOverviewSchema = z.object({
  thisMonthRevenue: z.number(),
  totalRevenue: z.number(),
  thisMonthCount: z.number(),
  totalEnrollments: z.number(),
  periods: z.object({
    today: periodNumbersSchema,
    week: periodNumbersSchema,
    month: periodNumbersSchema,
    lifetime: periodNumbersSchema,
  }),
  /** The chosen range */
  selected: periodNumbersSchema.extend({ breakdown: breakdownSchema }),
  granularity: z.enum(GRANULARITIES),
  chartData: z.array(performancePointSchema),
  /** All time */
  breakdown: breakdownSchema,
});
export type PerformanceOverview = z.infer<typeof performanceOverviewSchema>;

/** One item of GET /api/performance/courses: title, cover, status and the paid-student count. */
export const performanceCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  coverImage: z.string().nullish(),
  status: z.enum(['Draft', 'Published']),
  paidStudents: z.number(),
});
export type PerformanceCourse = z.infer<typeof performanceCourseSchema>;
