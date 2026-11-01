'use client';

import { useMemo, useState } from 'react';

import { useMyQuizAttempts, useResetQuizAttempt, useSubmitQuizAnswer } from '@/api/learn-quiz.api';
import { useCheckPracticeAnswer } from '@/api/practice-quiz.api';
import { useQuizBanks } from '@/api/quiz.api';
import { toAnswerMap, type AnswerMap } from '@/components/common/quiz/quiz.utils';
import { useAuth } from '@/hooks/useAuth';

import type { ApiError } from '@/services/http.service';
import type { QuizBank } from '@/schemas/quiz.schema';

/** What the server revealed for an answered question. */
export interface Reveal {
  correctOptionIndices: number[];
  explanations: readonly (string | null | undefined)[];
}
export type RevealMap = Map<string, Reveal>;

export interface PracticeAnswers {
  /** 'pending' while the "me" check runs (answers cannot be checked yet) */
  mode: 'pending' | 'guest' | 'member';
  answers: AnswerMap;
  reveal: RevealMap;
  /** Signed in: the saved answers could not be loaded */
  error: ApiError | null;
  checking: boolean;
  /** Checks (guest) or saves (signed in) one answer; rejects with an ApiError */
  check: (bankId: string, questionId: string, selected: number[]) => Promise<unknown>;
  /** Clears the answers of one bank (signed in: deletes the attempt); rejects with an ApiError */
  reset: (bankId: string, questionIds: readonly string[]) => Promise<unknown>;
}

interface GuestState {
  answers: AnswerMap;
  reveal: RevealMap;
}

const revealOf = (banks: QuizBank[] | undefined): RevealMap =>
  new Map(
    (banks ?? []).flatMap((bank) =>
      bank.questions.flatMap((question) =>
        question.correctOptionIndices
          ? [
              [
                question._id,
                {
                  correctOptionIndices: question.correctOptionIndices,
                  explanations: question.options.map((option) => option.explanation),
                },
              ] as const,
            ]
          : [],
      ),
    ),
  );

const without = <V>(map: Map<string, V>, keys: readonly string[]): Map<string, V> => {
  const next = new Map(map);
  keys.forEach((key) => next.delete(key));
  return next;
};

/**
 * Answers of the practice page. Guests: checked by the public endpoint and kept in memory only. Signed in:
 * saved in the user's attempt (one answer per question; reset to retry), correct options revealed by the
 * bank list after answering.
 */
export const usePracticeAnswers = (courseId: string | null): PracticeAnswers => {
  const { user, isLoading } = useAuth();
  const member = user !== null;
  const memberCourse = member && courseId !== null;
  // Same requests and keys as the course player (refreshed after every answer)
  const attempts = useMyQuizAttempts(courseId ?? '', memberCourse);
  const banks = useQuizBanks(courseId ?? '', memberCourse);
  const submit = useSubmitQuizAnswer(courseId ?? '');
  const resetAttempt = useResetQuizAttempt(courseId ?? '');
  const guestCheck = useCheckPracticeAnswer();
  const [guest, setGuest] = useState<GuestState>({ answers: new Map(), reveal: new Map() });

  const memberAnswers = useMemo(() => toAnswerMap(attempts.data ?? []), [attempts.data]);
  const memberReveal = useMemo(() => revealOf(banks.data), [banks.data]);

  if (member) {
    return {
      mode: 'member',
      answers: memberAnswers,
      reveal: memberReveal,
      error: attempts.error ?? banks.error,
      checking: submit.isPending,
      check: (bankId, questionId, selected) =>
        submit.mutateAsync({ bankId, questionId, selectedOptionIndices: selected }),
      reset: (bankId) => resetAttempt.mutateAsync(bankId),
    };
  }

  return {
    mode: isLoading ? 'pending' : 'guest',
    answers: guest.answers,
    reveal: guest.reveal,
    error: null,
    checking: guestCheck.isPending,
    check: (bankId, questionId, selected) =>
      guestCheck
        .mutateAsync({ bankId, questionId, selectedOptionIndices: selected })
        .then((result) => {
          setGuest((current) => ({
            answers: new Map(current.answers).set(questionId, {
              questionId,
              selectedOptionIndices: selected,
              isCorrect: result.isCorrect,
            }),
            reveal: new Map(current.reveal).set(questionId, {
              correctOptionIndices: result.correctOptionIndices,
              explanations: result.explanations,
            }),
          }));
        }),
    reset: (_bankId, questionIds) => {
      setGuest((current) => ({
        answers: without(current.answers, questionIds),
        reveal: without(current.reveal, questionIds),
      }));
      return Promise.resolve();
    },
  };
};
