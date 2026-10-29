import api from './api';
import type { IQuestion, IAnswer, ICourseQuestionGroup } from '../types/index';

export const qaService = {
  getAllCourseQuestions: () =>
    api.get<ICourseQuestionGroup[]>('/qa/admin/course-questions'),

  getCourseQuestions: (courseId: string) =>
    api.get<IQuestion[]>(`/qa/questions/course/${courseId}`),

  getQuestion: (id: string) =>
    api.get<{ question: IQuestion; answers: IAnswer[] }>(`/qa/questions/${id}`),

  createQuestion: (courseId: string, data: { title: string; description: string }) =>
    api.post<IQuestion>(`/qa/questions/course/${courseId}`, data),

  updateQuestion: (id: string, data: { title: string; description: string }) =>
    api.put<IQuestion>(`/qa/questions/${id}`, data),

  deleteQuestion: (id: string) => api.delete(`/qa/questions/${id}`),

  upvoteQuestion: (id: string) =>
    api.patch<{ upvotes: string[] }>(`/qa/questions/${id}/upvote`),

  resolveQuestion: (id: string, isResolved: boolean) =>
    api.patch<IQuestion>(`/qa/questions/${id}/resolve`, { isResolved }),

  createAnswer: (questionId: string, data: { body: string }) =>
    api.post<IAnswer>(`/qa/answers/question/${questionId}`, data),

  updateAnswer: (id: string, data: { body: string }) =>
    api.put<IAnswer>(`/qa/answers/${id}`, data),

  deleteAnswer: (id: string) => api.delete(`/qa/answers/${id}`),

  upvoteAnswer: (id: string) =>
    api.patch<{ upvotes: string[] }>(`/qa/answers/${id}/upvote`),
};
