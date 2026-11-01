'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  quizBankSchema,
  quizSectionSchema,
  type QuizBank,
  type QuizSection,
} from '@/schemas/quiz.schema';
import { practiceTreeSchema, type PracticeTree } from '@/schemas/practice-quiz.schema';
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

/**
 * GET /api/quiz-bank/public/course/:courseId: the free-preview sections and banks of a course (no answers).
 * One request and key for the course page (sections only, via select) and the practice quiz page.
 */
export const getPublicQuizTree = (courseId: string): Promise<PracticeTree> =>
  http.get(`/api/quiz-bank/public/course/${enc(courseId)}`, practiceTreeSchema);

export const useQuizSections = (courseId: string): UseQueryResult<QuizSection[], ApiError> =>
  useQuery({
    queryKey: queryKeys.quiz.sections(courseId),
    queryFn: () => getQuizSections(courseId),
  });

/** The course's banks as the viewer may read them (answered questions carry their correct options). */
export const useQuizBanks = (
  courseId: string,
  enabled = true,
): UseQueryResult<QuizBank[], ApiError> =>
  useQuery({
    queryKey: queryKeys.quiz.banks(courseId),
    queryFn: () => getQuizBanks(courseId),
    enabled,
  });
