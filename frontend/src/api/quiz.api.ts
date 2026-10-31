'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  quizBankSchema,
  quizSectionSchema,
  type QuizBank,
  type QuizSection,
} from '@/schemas/quiz.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// The quiz sections and banks of a course: one request and cache entry each, read by the course editor and
// the course player. Managing them: course-editor.api.ts; answering: learn-quiz.api.ts. Both invalidate
// queryKeys.quiz.*.

const enc = encodeURIComponent;

export const getQuizSections = (courseId: string): Promise<QuizSection[]> =>
  http.get(`/api/quiz-sections/course/${enc(courseId)}`, z.array(quizSectionSchema));

export const getQuizBanks = (courseId: string): Promise<QuizBank[]> =>
  http.get(`/api/quiz-bank/course/${enc(courseId)}`, z.array(quizBankSchema));

export const useQuizSections = (courseId: string): UseQueryResult<QuizSection[], ApiError> =>
  useQuery({
    queryKey: queryKeys.quiz.sections(courseId),
    queryFn: () => getQuizSections(courseId),
  });

export const useQuizBanks = (courseId: string): UseQueryResult<QuizBank[], ApiError> =>
  useQuery({
    queryKey: queryKeys.quiz.banks(courseId),
    queryFn: () => getQuizBanks(courseId),
  });
