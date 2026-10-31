'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import { quizAttemptSchema, type QuizAttempt } from '@/schemas/quiz.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// Taking quizzes in the course player. The server marks every answer; correct answers and explanations only
// arrive (with the bank list, quiz.api.ts) after a question was answered. Managing banks: course-editor.api.ts.

const enc = encodeURIComponent;

export interface SubmitAnswerVariables {
  bankId: string;
  questionId: string;
  selectedOptionIndices: number[];
}

// ---- Requests ----

export const getMyQuizAttempts = (courseId: string): Promise<QuizAttempt[]> =>
  http.get(`/api/quiz-bank/course/${enc(courseId)}/my-attempts`, z.array(quizAttemptSchema));

export const submitQuizAnswer = ({
  bankId,
  questionId,
  selectedOptionIndices,
}: SubmitAnswerVariables): Promise<QuizAttempt> =>
  http.post(
    `/api/quiz-bank/${enc(bankId)}/attempt/answer`,
    { questionId, selectedOptionIndices },
    quizAttemptSchema,
  );

export const resetQuizAttempt = async (bankId: string): Promise<void> => {
  await http.send('DELETE', `/api/quiz-bank/${enc(bankId)}/attempt`);
};

// ---- Hooks ----

export const useMyQuizAttempts = (courseId: string): UseQueryResult<QuizAttempt[], ApiError> =>
  useQuery({
    queryKey: queryKeys.learn.quizAttempts(courseId),
    queryFn: () => getMyQuizAttempts(courseId),
  });

/**
 * Answers one question. The returned attempt replaces the cached one at once (so the result shows), then the
 * banks are read again to receive the now revealed correct answers and explanations.
 */
export const useSubmitQuizAnswer = (
  courseId: string,
): UseMutationResult<QuizAttempt, ApiError, SubmitAnswerVariables> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitQuizAnswer,
    onSuccess: async (attempt) => {
      queryClient.setQueryData<QuizAttempt[]>(
        queryKeys.learn.quizAttempts(courseId),
        (list = []) => [...list.filter((item) => item.quizBank !== attempt.quizBank), attempt],
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.quiz.banks(courseId) });
    },
    // 409 (already answered elsewhere): show the stored answer instead
    onError: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.learn.quizAttempts(courseId) }),
  });
};

export const useResetQuizAttempt = (
  courseId: string,
): UseMutationResult<void, ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetQuizAttempt,
    onSuccess: async (_result, bankId) => {
      queryClient.setQueryData<QuizAttempt[]>(queryKeys.learn.quizAttempts(courseId), (list = []) =>
        list.filter((item) => item.quizBank !== bankId),
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.quiz.banks(courseId) });
    },
  });
};
