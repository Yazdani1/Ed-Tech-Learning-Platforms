import api from './api';
import type { INotification, NotificationPriority, UserRole } from '../types';

export const notificationService = {
	getMine: () => api.get<INotification[]>('/notifications'),
	getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
	getSent: () => api.get<INotification[]>('/notifications/sent/all'),
	create: (data: {
		title: string;
		message: string;
		priority: NotificationPriority;
		targetRoles: UserRole[];
	}) => api.post<INotification>('/notifications', data),
	markRead: (id: string) => api.patch<INotification>(`/notifications/${id}/read`),
	markAllRead: () => api.patch('/notifications/read-all'),
};
