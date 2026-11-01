'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  practiceCheckResultSchema,
  practiceCourseSchema,
  type PracticeCheckResult,
  type PracticeCourse,
  type PracticeCourseFilters,
  type PracticeTree,
} from '@/schemas/practice-quiz.schema';
import { http, type ApiError } from '@/services/http.service';

import { getPublicQuizTree } from './quiz.api';
import { queryKeys } from './query-keys';

// Public practice quiz. Guests check answers with the public endpoint (nothing stored). Signed-in users answer
// into their attempt with learn-quiz.api.ts (useSubmitQuizAnswer / useResetQuizAttempt); their attempts and
// the revealed answers come from the course player's hooks (useMyQuizAttempts, useQuizBanks).

const enc = encodeURIComponent;

export interface CheckPracticeAnswerVariables {
  bankId: string;
  questionId: string;
  selectedOptionIndices: number[];
}

// ---- Requests ----

/** Only the filters that are set are sent. */
const toParams = (filters: PracticeCourseFilters): Record<string, string> =>
  Object.fromEntries(
    Object.entries({ ...filters, search: filters.search.trim() }).filter(([, value]) => value),
  );

export const getPracticeCourses = (filters: PracticeCourseFilters): Promise<PracticeCourse[]> =>
  http.get('/api/quiz-bank/public/courses', z.array(practiceCourseSchema), {
    params: toParams(filters),
  });

export const checkPracticeAnswer = ({
  bankId,
  questionId,
  selectedOptionIndices,
}: CheckPracticeAnswerVariables): Promise<PracticeCheckResult> =>
  http.post(
    `/api/quiz-bank/public/${enc(bankId)}/questions/${enc(questionId)}/check`,
    { selectedOptionIndices },
    practiceCheckResultSchema,
  );

// ---- Hooks ----

export const usePracticeCourses = (
  filters: PracticeCourseFilters,
): UseQueryResult<PracticeCourse[], ApiError> =>
  useQuery({
    queryKey: queryKeys.practiceQuiz.courses(toParams(filters)),
    queryFn: () => getPracticeCourses(filters),
    placeholderData: keepPreviousData,
  });

/** The free-preview sections and banks of a course, with questions (same entry as the course page). */
export const usePracticeTree = (courseId: string | null): UseQueryResult<PracticeTree, ApiError> =>
  useQuery({
    queryKey: queryKeys.quiz.publicTree(courseId ?? ''),
    queryFn: () => getPublicQuizTree(courseId ?? ''),
    enabled: courseId !== null,
  });

export const useCheckPracticeAnswer = (): UseMutationResult<
  PracticeCheckResult,
  ApiError,
  CheckPracticeAnswerVariables
> => useMutation({ mutationFn: checkPracticeAnswer });
