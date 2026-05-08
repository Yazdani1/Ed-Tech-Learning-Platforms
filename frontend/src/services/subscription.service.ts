import api from './api';
import type { ISubscription, SubscriptionPlan } from '../types/index';

export const subscriptionService = {
	getAll: () => api.get<ISubscription[]>('/subscriptions'),
	getMySubscription: () => api.get<ISubscription>('/subscriptions/my'),
	assign: (data: { userId: string; plan: SubscriptionPlan; billingDuration: number; endDate: string }) =>
		api.post<ISubscription>('/subscriptions/assign', data),
	cancel: (id: string) => api.patch(`/subscriptions/${id}/cancel`),
	subscribe: (plan: SubscriptionPlan, billingDuration: number) =>
		api.post<ISubscription>('/subscriptions/subscribe', { plan, billingDuration }),
	cancelMy: () => api.delete('/subscriptions/cancel-my'),
};
