import api from './api';
import type { IQuizSection } from '../types/index';

export const quizSectionService = {
  getByCourse: (courseId: string) =>
    api.get<IQuizSection[]>(`/quiz-sections/course/${courseId}`),

  create: (data: { course: string; title: string }) =>
    api.post<IQuizSection>('/quiz-sections', data),

  update: (id: string, data: { title: string }) =>
    api.put<IQuizSection>(`/quiz-sections/${id}`, data),

  delete: (id: string) => api.delete(`/quiz-sections/${id}`),
};
