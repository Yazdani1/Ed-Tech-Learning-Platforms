import api from './api';
import type { IDashboardSummary } from '../types/index';

export const dashboardService = {
  getSummary: () => api.get<IDashboardSummary>('/dashboard/summary'),
};
