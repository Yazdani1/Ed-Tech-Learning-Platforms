import api from './api';
import type { ICourse, ISection, ILecture } from '../types/index';

export const courseService = {
	getAll: (params?: Record<string, string>) =>
		api.get<ICourse[]>('/courses', { params }),

	browse: (params?: Record<string, string>) =>
		api.get<ICourse[]>('/courses/browse', { params }),

	getById: (id: string) => api.get<ICourse>(`/courses/${id}`),

	create: (data: FormData) => api.post<ICourse>('/courses', data),

	update: (id: string, data: FormData) =>
		api.put<ICourse>(`/courses/${id}`, data),

	updateStatus: (id: string, status: 'Draft' | 'Published') =>
		api.patch<ICourse>(`/courses/${id}/status`, { status }),

	delete: (id: string) => api.delete(`/courses/${id}`),

	bulkUpdate: (payload: {
		courseIds: string[];
		updates?: {
			courseType?: string | null;
			category?: string;
			startDate?: string | null;
			endDate?: string | null;
			status?: string;
			visibility?: string;
			pricing?: string;
			price?: number | null;
			includedInSubscription?: boolean;
			allowedSubscriptionPlans?: string[];
			teachers?: string[];
		};
		announcement?: { title: string; description: string };
	}) => api.patch('/courses/bulk', payload),

	// Enrollment
	getEnrolled: () => api.get<ICourse[]>('/enrollments'),
	checkEnrollment: (id: string) =>
		api.get<{ isEnrolled: boolean; enrolledAt?: string }>(
			`/enrollments/${id}/check`,
		),
	enroll: (id: string, enrollmentType?: 'paid' | 'subscription') =>
		api.post(`/enrollments/${id}`, enrollmentType ? { enrollmentType } : undefined),
	unenroll: (id: string) => api.delete(`/enrollments/${id}`),

	// Sections
	addSection: (courseId: string, title: string) =>
		api.post<ISection>(`/courses/${courseId}/sections`, { title }),

	updateSection: (courseId: string, sectionId: string, title: string) =>
		api.put<ISection>(`/courses/${courseId}/sections/${sectionId}`, { title }),

	deleteSection: (courseId: string, sectionId: string) =>
		api.delete(`/courses/${courseId}/sections/${sectionId}`),

	reorderSections: (courseId: string, orderedIds: string[]) =>
		api.put(`/courses/${courseId}/sections/reorder`, { orderedIds }),

	// Lectures
	addLecture: (courseId: string, sectionId: string, data: Partial<ILecture>) =>
		api.post<ILecture>(
			`/courses/${courseId}/sections/${sectionId}/lectures`,
			data,
		),

	updateLecture: (
		courseId: string,
		sectionId: string,
		lectureId: string,
		data: Partial<ILecture>,
	) =>
		api.put<ILecture>(
			`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}`,
			data,
		),

	deleteLecture: (courseId: string, sectionId: string, lectureId: string) =>
		api.delete(
			`/courses/${courseId}/sections/${sectionId}/lectures/${lectureId}`,
		),

	reorderLectures: (
		courseId: string,
		sectionId: string,
		orderedIds: string[],
	) =>
		api.put(`/courses/${courseId}/sections/${sectionId}/lectures/reorder`, {
			orderedIds,
		}),
};
