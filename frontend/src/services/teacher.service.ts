import api from './api';
import type { ITeacher } from '../types/index';

export const teacherService = {
  getAll: () => api.get<ITeacher[]>('/teachers'),
  getById: (id: string) => api.get<ITeacher>(`/teachers/${id}`),
  create: (data: FormData) => api.post<ITeacher>('/teachers', data),
  update: (id: string, data: FormData) => api.put<ITeacher>(`/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/teachers/${id}`),
};
