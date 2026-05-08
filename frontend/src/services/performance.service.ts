import api from './api';
import type { IPerformanceData, ICourse, DateRange } from '../types/index';

export const performanceService = {
  getOverview: (courseId: string, dateRange: DateRange) =>
    api.get<IPerformanceData>('/performance/overview', { params: { courseId, dateRange } }),

  getCourses: () => api.get<ICourse[]>('/performance/courses'),
};
