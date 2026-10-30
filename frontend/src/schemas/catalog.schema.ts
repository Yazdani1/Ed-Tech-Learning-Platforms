import { z } from 'zod';

// Shapes of the catalog reads that several screens share (public site, course browser, student area,
// profile, course setup). One schema per endpoint, matching what the backend really sends.

/** Categories and course types: same endpoints and shape, only the path differs. */
export type TaxonomyKind = 'category' | 'courseType';

/** GET /api/categories and GET /api/course-types items (also what POST/PUT return). */
export const taxonomySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string().default(''),
  description: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Taxonomy = z.infer<typeof taxonomySchema>;

export const billingOptionSchema = z.object({
  label: z.string(),
  duration: z.number(),
  price: z.number(),
});
export type BillingOption = z.infer<typeof billingOptionSchema>;

/** GET /api/subscription-plans items (active plans, cheapest first, with their course count). */
export const subscriptionPlanSchema = z.object({
  _id: z.string(),
  plan: z.string(),
  price: z.number(),
  duration: z.number(),
  billingOptions: z.array(billingOptionSchema).catch([]),
  features: z.array(z.string()).catch([]),
  badge: z.string().nullish(),
  color: z.string().nullish(),
  courseCount: z.number().catch(0),
});
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

/** How a student got into a course (Enrollment.enrollmentType on the backend). */
export const enrollmentTypeSchema = z.enum(['free', 'paid', 'subscription']);
export type EnrollmentType = z.infer<typeof enrollmentTypeSchema>;

const namedRefSchema = z.object({ _id: z.string(), name: z.string() });

/**
 * One item of GET /api/enrollments (signed-in Student): the populated course plus the enrolment type.
 * Populated refs may be null when the category/type/teacher was deleted.
 */
export const enrolledCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  coverImage: z.string().nullish(),
  pricing: z.enum(['Free', 'Paid']),
  price: z.number().nullish(),
  listPrice: z.number().nullish(),
  discountPrice: z.number().nullish(),
  discountEndsAt: z.string().nullish(),
  category: namedRefSchema.nullish(),
  courseType: namedRefSchema.nullish(),
  teachers: z.array(namedRefSchema.nullable()).catch([]),
  enrollmentType: enrollmentTypeSchema,
});
export type EnrolledCourse = z.infer<typeof enrolledCourseSchema>;

/** GET /api/subscriptions/my (the active subscription, or null) and POST /api/subscriptions/subscribe. */
export const subscriptionSchema = z.object({
  _id: z.string(),
  plan: z.string(),
  billingDuration: z.number().nullish(),
  endDate: z.string(),
  status: z.string(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;
