import api from './api';
import type { IStudyMaterial } from '../types/index';

export const studyMaterialService = {
  getByCourse: (courseId: string) =>
    api.get<IStudyMaterial[]>(`/study-materials/course/${courseId}`),
  create: (courseId: string, data: { title: string; description: string; fileUrl?: string }) =>
    api.post<IStudyMaterial>(`/study-materials/course/${courseId}`, data),
  update: (id: string, data: { title: string; description: string; fileUrl?: string }) =>
    api.put<IStudyMaterial>(`/study-materials/${id}`, data),
  delete: (id: string) => api.delete(`/study-materials/${id}`),
};
