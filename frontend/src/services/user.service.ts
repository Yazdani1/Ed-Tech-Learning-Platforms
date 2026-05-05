import api from './api';
import type { IUser } from '../types/index';

export const userService = {
  create: (data: { name: string; email: string; password: string; role: IUser['role'] }) =>
    api.post<IUser>('/users', data),
  getAll: () => api.get<IUser[]>('/users'),
  getById: (id: string) => api.get<IUser>(`/users/${id}`),
  update: (
    id: string,
    data: { name: string; email: string; password?: string; role: IUser['role'] },
  ) => api.put<IUser>(`/users/${id}`, data),
  updateRole: (id: string, role: IUser['role']) =>
    api.put<IUser>(`/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/users/${id}`),
};
