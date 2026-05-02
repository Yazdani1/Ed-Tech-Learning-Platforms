import api from './api';
import type { IStudyMaterial } from '../types/index';

export const studyMaterialService = {
  getByCourse: (courseId: string) =>
    api.get<IStudyMaterial[]>(`/study-materials/course/${courseId}`),
  create: (courseId: string, data: { title: string; description: string; fileUrl?: string }) =>
    api.post<IStudyMaterial>(`/study-materials/course/${courseId}`, data),
  delete: (id: string) => api.delete(`/study-materials/${id}`),
};
