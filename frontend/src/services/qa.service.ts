import api from './api';
import type { IQuestion, IAnswer } from '../types/index';

export const qaService = {
  getCourseQuestions: (courseId: string) =>
    api.get<IQuestion[]>(`/qa/questions/course/${courseId}`),

  getQuestion: (id: string) =>
    api.get<{ question: IQuestion; answers: IAnswer[] }>(`/qa/questions/${id}`),

  createQuestion: (courseId: string, data: { title: string; description: string }) =>
    api.post<IQuestion>(`/qa/questions/course/${courseId}`, data),

  deleteQuestion: (id: string) => api.delete(`/qa/questions/${id}`),

  upvoteQuestion: (id: string) =>
    api.patch<{ upvotes: string[] }>(`/qa/questions/${id}/upvote`),

  createAnswer: (questionId: string, data: { body: string }) =>
    api.post<IAnswer>(`/qa/answers/question/${questionId}`, data),

  deleteAnswer: (id: string) => api.delete(`/qa/answers/${id}`),

  upvoteAnswer: (id: string) =>
    api.patch<{ upvotes: string[] }>(`/qa/answers/${id}/upvote`),
};
