import { z } from 'zod';

import { categoryRefSchema, coursePricingSchema, courseTypeRefSchema } from './browse.schema';

// Staff course list and enrolment shapes: GET /api/courses (staff view), the course enrolment endpoints and
// the bulk edit body. A populated reference whose document was deleted comes back as null.

export const COURSE_STATUSES = ['Published', 'Draft'] as const;
export const COURSE_VISIBILITIES = ['Public', 'Private'] as const;
export const COURSE_PRICINGS = ['Free', 'Paid'] as const;

export const courseStatusSchema = z.enum(COURSE_STATUSES);
export type CourseStatus = z.infer<typeof courseStatusSchema>;
export type CourseVisibility = (typeof COURSE_VISIBILITIES)[number];

const teacherNameSchema = z.object({ _id: z.string(), name: z.string() });

/** Per-course enrolment figures (staff only); amounts in BDT. */
export const courseEnrollmentStatsSchema = z.object({
  totalEnrollments: z.number().catch(0),
  lifetimeEarned: z.number().catch(0),
  thisMonthCount: z.number().catch(0),
  thisMonthEarned: z.number().catch(0),
  previousMonthCount: z.number().catch(0),
  previousMonthEarned: z.number().catch(0),
});
export type CourseEnrollmentStats = z.infer<typeof courseEnrollmentStatsSchema>;

/** One item of GET /api/courses as staff get it (every status and visibility, with statistics). */
export const adminCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  subtitle: z.string().nullish(),
  coverImage: z.string().nullish(),
  category: categoryRefSchema.nullish(),
  courseType: courseTypeRefSchema.nullish(),
  teachers: z.array(teacherNameSchema.nullable()).catch([]),
  status: courseStatusSchema.catch('Draft'),
  visibility: z.string().catch('Public'),
  pricing: coursePricingSchema,
  price: z.number().nullish(),
  listPrice: z.number().nullish(),
  discountPrice: z.number().nullish(),
  discountEndsAt: z.string().nullish(),
  discountStartsAt: z.string().nullish(),
  includedInSubscription: z.boolean().catch(false),
  publishedAt: z.string().nullish(),
  firstPublishedAt: z.string().nullish(),
  batchNumber: z.string().nullish(),
  /** Course page visits (one per visitor per day) */
  viewCount: z.number().catch(0),
  updatedAt: z.string().nullish(),
  enrollmentStats: courseEnrollmentStatsSchema.nullish(),
});
export type AdminCourse = z.infer<typeof adminCourseSchema>;

/** GET /api/enrollments/admin/course/:courseId/stats */
export const enrollmentStatsSchema = z.object({
  total: z.number(),
  free: z.number(),
  paid: z.number(),
  subscription: z.number(),
  lifetimeEarned: z.number(),
  thisMonthCount: z.number(),
  thisMonthEarned: z.number(),
});
export type EnrollmentStats = z.infer<typeof enrollmentStatsSchema>;

/** PATCH /api/courses/bulk `updates`: only the fields the admin filled in. */
export interface BulkCourseUpdates {
  courseType?: string | null;
  category?: string;
  status?: CourseStatus;
  visibility?: CourseVisibility;
  pricing?: 'Free' | 'Paid';
  price?: number | null;
  includedInSubscription?: boolean;
  allowedSubscriptionPlans?: string[];
  teachers?: string[];
  startDate?: string | null;
  endDate?: string | null;
}

/** PATCH /api/courses/bulk body: the fields to set on every selected course. */
export interface BulkUpdateRequest {
  courseIds: string[];
  updates?: BulkCourseUpdates;
}
