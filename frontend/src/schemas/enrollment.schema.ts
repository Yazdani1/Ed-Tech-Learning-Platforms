import { z } from 'zod';

import { enrollmentTypeSchema } from './catalog.schema';

// Enrolled students of one course: GET /api/enrollments/course/:courseId/students (staff admins, Moderators
// and the course's teachers; teachers get no email). Used by the admin enrolments page, the course player's
// Students tab and the teacher's students dialog.

/** The populated student (null when the account was deleted). */
export const enrolledStudentSchema = z
  .object({
    _id: z.string(),
    name: z.string().catch(''),
    email: z.string().nullish(),
    avatar: z.string().nullish(),
  })
  .nullable()
  .catch(null);
export type EnrolledStudent = z.infer<typeof enrolledStudentSchema>;

export const courseStudentSchema = z.object({
  _id: z.string(),
  student: enrolledStudentSchema,
  /** The backend stores 'free' when nothing else was set */
  enrollmentType: enrollmentTypeSchema.catch('free'),
  createdAt: z.string(),
});
export type CourseStudent = z.infer<typeof courseStudentSchema>;
