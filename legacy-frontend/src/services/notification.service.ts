import api from './api';
import type { INotification, NotificationPriority, UserRole } from '../types';

export const notificationService = {
	getMine: (params?: { page?: number; limit?: number }) =>
		api.get<INotification[]>('/notifications', { params }),
	getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
	getSent: (params?: { page?: number; limit?: number }) =>
		api.get<INotification[]>('/notifications/sent/all', { params }),
	create: (data: {
		title: string;
		message: string;
		priority: NotificationPriority;
		targetRoles: UserRole[];
	}) => api.post<INotification>('/notifications', data),
	update: (
		id: string,
		data: {
			title: string;
			message: string;
			priority: NotificationPriority;
			targetRoles: UserRole[];
		},
	) => api.put<INotification>(`/notifications/${id}`, data),
	delete: (id: string) => api.delete(`/notifications/${id}`),
	markRead: (id: string) => api.patch<INotification>(`/notifications/${id}/read`),
	markAllRead: () => api.patch('/notifications/read-all'),
};
