import api from './api';
import type { IStudySchedule } from '../types/index';

export type CreateTimerPayload = {
	title: string;
	description: string;
	duration: number;
};

export type CreateReminderPayload = {
	title: string;
	description: string;
	startDateTime: string;
	endDateTime?: string;
};

export type UpdateSchedulePayload = {
	status?: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
	elapsedSeconds?: number;
	completedAt?: string;
	firedAt?: string;
	title?: string;
	description?: string;
	startDateTime?: string;
	endDateTime?: string | null;
};

export const studyScheduleService = {
	getAll: (params?: { type?: string; status?: string }) =>
		api.get<IStudySchedule[]>('/study-schedules', { params }),
	createTimer: (data: CreateTimerPayload) =>
		api.post<IStudySchedule>('/study-schedules/timer', data),
	createReminder: (data: CreateReminderPayload) =>
		api.post<IStudySchedule>('/study-schedules/reminder', data),
	update: (id: string, data: UpdateSchedulePayload) =>
		api.put<IStudySchedule>(`/study-schedules/${id}`, data),
	delete: (id: string) => api.delete(`/study-schedules/${id}`),
};
