import api from './api';
import type { IStudyCurriculum, IStudyCurriculumLecture } from '../types/index';

export type StudyCurriculumPayload = {
	title: string;
	description: string;
	weekName: string;
	lectures: IStudyCurriculumLecture[];
};

export const studyCurriculumService = {
	getByCourse: (courseId: string) =>
		api.get<IStudyCurriculum[]>(`/study-curricula/course/${courseId}`),
	create: (courseId: string, data: StudyCurriculumPayload) =>
		api.post<IStudyCurriculum>(`/study-curricula/course/${courseId}`, data),
	update: (id: string, data: StudyCurriculumPayload) =>
		api.put<IStudyCurriculum>(`/study-curricula/${id}`, data),
	delete: (id: string) => api.delete(`/study-curricula/${id}`),
};
