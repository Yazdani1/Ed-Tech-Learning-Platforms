import api from './api';
import type { IQuizBank, IQuizAttempt, IPublicCourseQuizTree, IPublicCourse } from '../types/index';

export const quizBankService = {
  getByCourse: (courseId: string) =>
    api.get<IQuizBank[]>(`/quiz-bank/course/${courseId}`),

  getByContext: (contextType: string, contextId: string) =>
    api.get<IQuizBank[]>(`/quiz-bank/context/${contextType}/${contextId}`),

  getById: (id: string) => api.get<IQuizBank>(`/quiz-bank/${id}`),

  create: (data: {
    course: string;
    quizSection?: string;
    contextType?: string;
    contextId?: string;
    title: string;
    description?: string;
    isFreePreview?: boolean;
  }) => api.post<IQuizBank>('/quiz-bank', data),

  update: (id: string, data: { title?: string; description?: string; isFreePreview?: boolean }) =>
    api.put<IQuizBank>(`/quiz-bank/${id}`, data),

  delete: (id: string) => api.delete(`/quiz-bank/${id}`),

  addQuestion: (
    id: string,
    data: {
      question: string;
      options: { text: string; explanation?: string }[];
      correctOptionIndices: number[];
    },
  ) => api.post<IQuizBank>(`/quiz-bank/${id}/questions`, data),

  updateQuestion: (
    id: string,
    qId: string,
    data: {
      question?: string;
      options?: { text: string; explanation?: string }[];
      correctOptionIndices?: number[];
    },
  ) => api.put<IQuizBank>(`/quiz-bank/${id}/questions/${qId}`, data),

  deleteQuestion: (id: string, qId: string) =>
    api.delete<IQuizBank>(`/quiz-bank/${id}/questions/${qId}`),

  getMyAttempt: (id: string) =>
    api.get<IQuizAttempt | null>(`/quiz-bank/${id}/attempt`),

  submitAnswer: (
    id: string,
    data: { questionId: string; selectedOptionIndices: number[] },
  ) => api.post<IQuizAttempt>(`/quiz-bank/${id}/attempt/answer`, data),

  resetAttempt: (id: string) => api.delete(`/quiz-bank/${id}/attempt`),

  // Public (no auth required)
  getPublicCourses: () =>
    api.get<IPublicCourse[]>('/quiz-bank/public/courses'),

  getPublicCourseTree: (courseId: string) =>
    api.get<IPublicCourseQuizTree>(`/quiz-bank/public/course/${courseId}`),
};
