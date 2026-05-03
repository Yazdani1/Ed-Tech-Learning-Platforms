import api from './api';
import type { ICourseType } from '../types/index';

export const courseTypeService = {
  getAll: () => api.get<ICourseType[]>('/course-types'),
  create: (data: { name: string; description?: string }) =>
    api.post<ICourseType>('/course-types', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<ICourseType>(`/course-types/${id}`, data),
  delete: (id: string) => api.delete(`/course-types/${id}`),
};
