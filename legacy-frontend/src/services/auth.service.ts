import api from './api';
import type { IUser } from '../types/index';

export const authService = {
  login: (email: string, password: string) =>
    api.post<IUser>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post<IUser>('/auth/register', { name, email, password }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<IUser>('/auth/me'),

  updateMe: (data: FormData) => api.put<IUser>('/auth/me', data),
};
