import { http } from 'msw';

import {
  adminCourseSchema,
  adminEnrollmentSchema,
  enrollmentStatsSchema,
  type AdminCourse,
} from '@/schemas/admin-courses.schema';
import { courseStudentSchema } from '@/schemas/enrollment.schema';
import { ok } from '@/test/msw/handlers';

export const CATEGORY = {
  _id: '64b7f0c2a1b2c3d4e5f6c001',
  name: 'Programming',
  slug: 'programming',
};
export const COURSE_TYPE = {
  _id: '64b7f0c2a1b2c3d4e5f6d001',
  name: 'Live Batch',
  slug: 'live-batch',
};
export const TEACHER = {
  _id: '64b7f0c2a1b2c3d4e5f6e001',
  name: 'Rahim Uddin',
  bio: '',
  expertise: [],
};
export const PLAN = {
  _id: '64b7f0c2a1b2c3d4e5f6f001',
  plan: 'Gold',
  price: 500,
  duration: 1,
  billingOptions: [],
  features: [],
  courseCount: 1,
};

export const makeCourse = (id: string, overrides: Record<string, unknown> = {}): AdminCourse =>
  adminCourseSchema.parse({
    _id: `64b7f0c2a1b2c3d4e5f6a${id}`,
    title: `Course ${id}`,
    subtitle: 'A subtitle',
    category: CATEGORY,
    courseType: COURSE_TYPE,
    teachers: [{ _id: TEACHER._id, name: TEACHER.name }],
    status: 'Published',
    visibility: 'Public',
    pricing: 'Paid',
    price: 1200,
    listPrice: 1200,
    discountPrice: 1200,
    includedInSubscription: false,
    publishedAt: '2026-10-01T10:00:00.000Z',
    enrollmentStats: {
      totalEnrollments: 4,
      lifetimeEarned: 4800,
      thisMonthCount: 3,
      thisMonthEarned: 3600,
      previousMonthCount: 1,
      previousMonthEarned: 1200,
    },
    ...overrides,
  });

export const COURSE_ID = '64b7f0c2a1b2c3d4e5f6a001';

export const STATS = enrollmentStatsSchema.parse({
  total: 4,
  free: 1,
  paid: 2,
  subscription: 1,
  lifetimeEarned: 2400,
  thisMonthCount: 3,
  thisMonthEarned: 1200,
});

export const STUDENTS = [
  courseStudentSchema.parse({
    _id: 'enr1',
    student: { _id: 'stu1', name: 'Karim Ahmed', email: 'karim@example.com' },
    enrollmentType: 'paid',
    createdAt: '2026-10-02T09:00:00.000Z',
  }),
  courseStudentSchema.parse({
    _id: 'enr2',
    student: { _id: 'stu2', name: 'Nadia Islam', email: 'nadia@example.com' },
    enrollmentType: 'free',
    createdAt: '2026-10-03T09:00:00.000Z',
  }),
  courseStudentSchema.parse({
    _id: 'enr3',
    student: null,
    enrollmentType: 'subscription',
    createdAt: '2026-10-04T09:00:00.000Z',
  }),
];

export const PAID = [
  adminEnrollmentSchema.parse({
    _id: 'enr1',
    student: { _id: 'stu1', name: 'Karim Ahmed', email: 'karim@example.com' },
    enrollmentType: 'paid',
    listPrice: 1500,
    paidPrice: 1200,
    discountAmount: 300,
    discountPercent: 20,
    createdAt: '2026-10-02T09:00:00.000Z',
  }),
];

/** The dropdown sources of the filter panel and the bulk dialog. */
export const referenceHandlers = () => [
  http.get('*/api/categories', () => ok([CATEGORY])),
  http.get('*/api/course-types', () => ok([COURSE_TYPE])),
  http.get('*/api/teachers', () => ok([TEACHER])),
  http.get('*/api/subscription-plans', () => ok([PLAN])),
];
