import { http } from 'msw';

import { enrolledCourseSchema, type EnrolledCourse } from '@/schemas/catalog.schema';
import { ok } from '@/test/msw/handlers';

let nextId = 0;

/** An enrolled course as GET /api/enrollments returns it, checked against the app's schema. */
export const makeEnrolledCourse = (overrides: Partial<EnrolledCourse> = {}): EnrolledCourse => {
  nextId += 1;
  return enrolledCourseSchema.parse({
    _id: `64b7f0c2a1b2c3d4e5f7${String(nextId).padStart(4, '0')}`,
    title: `Course ${nextId}`,
    pricing: 'Free',
    category: { _id: '64b7f0c2a1b2c3d4e5f69001', name: 'Science' },
    courseType: { _id: '64b7f0c2a1b2c3d4e5f69002', name: 'HSC' },
    teachers: [{ _id: '64b7f0c2a1b2c3d4e5f69003', name: 'Dr. Rahman' }],
    enrollmentType: 'free',
    ...overrides,
  });
};

/** GET /api/enrollments answering with these courses. */
export const enrollmentsReturn = (courses: EnrolledCourse[]) =>
  http.get('*/api/enrollments', () => ok(courses, { total: courses.length }));
