import api from './api';
import type { IEnrollment, IEnrollmentStats, EnrollmentType } from '../types/index';

export const enrollmentService = {
  getCourseEnrollments: (courseId: string, type?: EnrollmentType | 'all') =>
    api.get<IEnrollment[]>(`/enrollments/admin/course/${courseId}`, {
      params: type && type !== 'all' ? { type } : undefined,
    }),

  getCourseStats: (courseId: string) =>
    api.get<IEnrollmentStats>(`/enrollments/admin/course/${courseId}/stats`),
};
