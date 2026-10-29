import api from './api';
import type { ITeacher, ICourse } from '../types/index';

export const teacherService = {
  getAll: () => api.get<ITeacher[]>('/teachers'),
  getById: (id: string) => api.get<ITeacher>(`/teachers/${id}`),
  getMyCourses: () => api.get<ICourse[]>('/teachers/my-courses'),
  create: (data: FormData) =>
    api.post<ITeacher>('/teachers', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put<ITeacher>(`/teachers/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/teachers/${id}`),
};
