import api from './api';
import type { IAnnouncement } from '../types/index';

export const announcementService = {
  getByCourse: (courseId: string) =>
    api.get<IAnnouncement[]>(`/announcements/course/${courseId}`),
  create: (courseId: string, data: { title: string; description: string }) =>
    api.post<IAnnouncement>(`/announcements/course/${courseId}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};
