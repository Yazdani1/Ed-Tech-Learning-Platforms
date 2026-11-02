import { z } from 'zod';

import { enrollmentTypeSchema } from './catalog.schema';

// Students page (Super Admin, Admin): GET /api/students, /api/students/courses, /api/students/:id.

const studentBaseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullish(),
  studentNumber: z.string().nullish(),
  avatar: z.string().nullish(),
  createdAt: z.string(),
});

/** One row of GET /api/students. */
export const studentRowSchema = studentBaseSchema.extend({
  enrolledCourses: z.number(),
  /** Paid courses + subscriptions, in Taka */
  totalSpent: z.number(),
});
export type StudentRow = z.infer<typeof studentRowSchema>;

/** One course of the students page's course picker. */
export const studentCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  coverImage: z.string().nullish(),
  status: z.string(),
  enrolledStudents: z.number(),
  paidStudents: z.number(),
});
export type StudentCourse = z.infer<typeof studentCourseSchema>;

const studentEnrollmentSchema = z.object({
  _id: z.string(),
  /** null when the course was deleted */
  course: z
    .object({ _id: z.string(), title: z.string(), coverImage: z.string().nullish() })
    .nullable(),
  enrollmentType: enrollmentTypeSchema,
  amountPaid: z.number(),
  createdAt: z.string(),
});
export type StudentEnrollment = z.infer<typeof studentEnrollmentSchema>;

const studentSubscriptionSchema = z.object({
  _id: z.string(),
  plan: z.string(),
  billingLabel: z.string().nullish(),
  status: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  amountPaid: z.number(),
});
export type StudentSubscription = z.infer<typeof studentSubscriptionSchema>;

/** GET /api/students/:id: contact details, courses bought, subscriptions and money spent. */
export const studentDetailsSchema = z.object({
  student: studentBaseSchema,
  enrollments: z.array(studentEnrollmentSchema),
  subscriptions: z.array(studentSubscriptionSchema),
  totals: z.object({
    enrolledCourses: z.number(),
    paidCourses: z.number(),
    courseSpent: z.number(),
    subscriptionSpent: z.number(),
    totalSpent: z.number(),
  }),
});
export type StudentDetails = z.infer<typeof studentDetailsSchema>;
