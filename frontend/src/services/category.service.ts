import api from './api';
import type { ICategory } from '../types/index';

export const categoryService = {
  getAll: () => api.get<ICategory[]>('/categories'),
  create: (data: { name: string; description?: string }) => api.post<ICategory>('/categories', data),
  update: (id: string, data: { name?: string; description?: string }) => api.put<ICategory>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};
