import api from './api';
import type { IEnrollment, IEnrollmentStats, EnrollmentType, ICourseStudentEnrollment } from '../types/index';

export const enrollmentService = {
  getCourseEnrollments: (courseId: string, type?: EnrollmentType | 'all') =>
    api.get<IEnrollment[]>(`/enrollments/admin/course/${courseId}`, {
      params: type && type !== 'all' ? { type } : undefined,
    }),

  getCourseStats: (courseId: string) =>
    api.get<IEnrollmentStats>(`/enrollments/admin/course/${courseId}/stats`),

  getCourseCount: (courseId: string) =>
    api.get<{ count: number }>(`/enrollments/course/${courseId}/count`),

  getCourseStudents: (courseId: string) =>
    api.get<ICourseStudentEnrollment[]>(`/enrollments/course/${courseId}/students`),

  exportCourseStudents: (courseId: string) =>
    api.getBlob(`/enrollments/course/${courseId}/students/export`),
};
