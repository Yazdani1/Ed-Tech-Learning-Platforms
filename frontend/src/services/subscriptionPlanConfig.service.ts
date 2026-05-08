import api from './api';
import type { ISubscriptionPlanConfig, SubscriptionPlan } from '../types/index';

export const subscriptionPlanConfigService = {
  getAll: () => api.get<ISubscriptionPlanConfig[]>('/subscription-plans'),

  upsert: (data: {
    plan: SubscriptionPlan;
    price?: number;
    duration?: number;
    billingOptions: Array<{
      label: string;
      duration: number;
      price: number;
    }>;
    features: string[];
    badge?: string;
    color?: string;
  }) => api.post<ISubscriptionPlanConfig>('/subscription-plans', data),

  delete: (id: string) => api.delete(`/subscription-plans/${id}`),
};
