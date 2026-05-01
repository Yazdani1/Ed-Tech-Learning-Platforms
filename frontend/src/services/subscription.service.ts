import api from './api';
import type { ISubscription, SubscriptionPlan } from '../types/index';

export const subscriptionService = {
	getAll: () => api.get<ISubscription[]>('/subscriptions'),
	getMySubscription: () => api.get<ISubscription>('/subscriptions/my'),
	assign: (data: { userId: string; plan: SubscriptionPlan; endDate: string }) =>
		api.post<ISubscription>('/subscriptions/assign', data),
	cancel: (id: string) => api.put(`/subscriptions/${id}/cancel`),
};
