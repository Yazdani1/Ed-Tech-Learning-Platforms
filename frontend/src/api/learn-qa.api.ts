'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  qaAnswerSchema,
  qaQuestionDetailSchema,
  qaQuestionSchema,
  upvotesSchema,
  type AnswerRequest,
  type QaAnswer,
  type QaQuestion,
  type QaQuestionDetail,
  type TitledPostRequest,
} from '@/schemas/learn.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// Course Q&A inside the course player: questions, answers, upvotes and resolve.

const enc = encodeURIComponent;
const QA = '/api/qa';

export interface SaveQuestionVariables {
  id?: string;
  body: TitledPostRequest;
}

export interface SaveAnswerVariables {
  id?: string;
  body: AnswerRequest;
}

// ---- Requests ----

export const getQuestions = (courseId: string): Promise<QaQuestion[]> =>
  http.get(`${QA}/questions/course/${enc(courseId)}`, z.array(qaQuestionSchema));

export const getQuestion = (id: string): Promise<QaQuestionDetail> =>
  http.get(`${QA}/questions/${enc(id)}`, qaQuestionDetailSchema);

export const saveQuestion = (
  courseId: string,
  { id, body }: SaveQuestionVariables,
): Promise<QaQuestion> =>
  id
    ? http.put(`${QA}/questions/${enc(id)}`, body, qaQuestionSchema)
    : http.post(`${QA}/questions/course/${enc(courseId)}`, body, qaQuestionSchema);

export const resolveQuestion = (id: string, isResolved: boolean): Promise<QaQuestion> =>
  http.patch(`${QA}/questions/${enc(id)}/resolve`, { isResolved }, qaQuestionSchema);

export const upvote = async (kind: 'questions' | 'answers', id: string): Promise<string[]> =>
  (await http.patch(`${QA}/${kind}/${enc(id)}/upvote`, undefined, upvotesSchema)).upvotes;

export const saveAnswer = (
  questionId: string,
  { id, body }: SaveAnswerVariables,
): Promise<QaAnswer> =>
  id
    ? http.put(`${QA}/answers/${enc(id)}`, body, qaAnswerSchema)
    : http.post(`${QA}/answers/question/${enc(questionId)}`, body, qaAnswerSchema);

export const deleteQaItem = async (kind: 'questions' | 'answers', id: string): Promise<void> => {
  await http.send('DELETE', `${QA}/${kind}/${enc(id)}`);
};

// ---- Hooks ----

export const useQuestions = (courseId: string): UseQueryResult<QaQuestion[], ApiError> =>
  useQuery({
    queryKey: queryKeys.learn.questions(courseId),
    queryFn: () => getQuestions(courseId),
  });

export const useQuestion = (id: string | null): UseQueryResult<QaQuestionDetail, ApiError> =>
  useQuery({
    queryKey: queryKeys.learn.question(id ?? ''),
    queryFn: () => getQuestion(id ?? ''),
    enabled: id !== null,
  });

/** After any Q&A change: the course's list, the open question and the staff Q&A overview are read again. */
const refreshQa = async (
  queryClient: QueryClient,
  courseId: string,
  questionId?: string,
): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.learn.questions(courseId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.people.qaGroups }),
    questionId
      ? queryClient.invalidateQueries({ queryKey: queryKeys.learn.question(questionId) })
      : Promise.resolve(),
  ]);
};

export const useSaveQuestion = (
  courseId: string,
): UseMutationResult<QaQuestion, ApiError, SaveQuestionVariables> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => saveQuestion(courseId, variables),
    onSuccess: (_question, variables) => refreshQa(queryClient, courseId, variables.id),
  });
};

export const useResolveQuestion = (
  courseId: string,
): UseMutationResult<QaQuestion, ApiError, { id: string; isResolved: boolean }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isResolved }) => resolveQuestion(id, isResolved),
    onSuccess: (_question, { id }) => refreshQa(queryClient, courseId, id),
  });
};

/** Toggles the caller's upvote; the new list from the server is written straight into the cache. */
export const useUpvoteQuestion = (
  courseId: string,
): UseMutationResult<string[], ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => upvote('questions', id),
    onSuccess: (upvotes, id) => {
      queryClient.setQueryData<QaQuestion[]>(queryKeys.learn.questions(courseId), (list) =>
        list?.map((question) => (question._id === id ? { ...question, upvotes } : question)),
      );
      queryClient.setQueryData<QaQuestionDetail>(queryKeys.learn.question(id), (detail) =>
        detail ? { ...detail, question: { ...detail.question, upvotes } } : detail,
      );
    },
  });
};

export const useUpvoteAnswer = (
  questionId: string,
): UseMutationResult<string[], ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => upvote('answers', id),
    onSuccess: (upvotes, id) => {
      queryClient.setQueryData<QaQuestionDetail>(queryKeys.learn.question(questionId), (detail) =>
        detail
          ? {
              ...detail,
              answers: detail.answers.map((answer) =>
                answer._id === id ? { ...answer, upvotes } : answer,
              ),
            }
          : detail,
      );
    },
  });
};

export const useSaveAnswer = (
  courseId: string,
  questionId: string,
): UseMutationResult<QaAnswer, ApiError, SaveAnswerVariables> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => saveAnswer(questionId, variables),
    onSuccess: () => refreshQa(queryClient, courseId, questionId),
  });
};

/** Deletes a question (questionId = the deleted one) or an answer (questionId = its question). */
export const useDeleteQaItem = (
  courseId: string,
): UseMutationResult<
  void,
  ApiError,
  { kind: 'questions' | 'answers'; id: string; questionId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id }) => deleteQaItem(kind, id),
    onSuccess: async (_result, { kind, questionId }) => {
      if (kind === 'questions')
        queryClient.removeQueries({ queryKey: queryKeys.learn.question(questionId) });
      await refreshQa(queryClient, courseId, kind === 'answers' ? questionId : undefined);
    },
  });
};
