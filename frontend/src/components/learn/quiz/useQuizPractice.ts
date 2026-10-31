'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useResetQuizAttempt, useSubmitQuizAnswer } from '@/api/learn-quiz.api';
import { useConfirm } from '@/hooks/useConfirm';

import type { Subsection } from './quiz.utils';

export interface QuizSelection {
  bankId: string;
  subsection: Subsection;
}

export interface QuizPractice {
  selection: QuizSelection | null;
  select: (selection: QuizSelection | null) => void;
  /** Index of the question shown in the current subsection */
  page: number;
  setPage: (page: number) => void;
  /** Options ticked for the current, not yet answered question */
  picked: number[];
  toggleOption: (index: number) => void;
  submit: (questionId: string) => void;
  submitting: boolean;
  reset: (bankId: string) => void;
}

/** State of the practice panel: chosen bank and subsection, current question, ticked options, submit/reset. */
export const useQuizPractice = (courseId: string): QuizPractice => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const submitAnswer = useSubmitQuizAnswer(courseId);
  const resetAttempt = useResetQuizAttempt(courseId);
  const [selection, setSelection] = useState<QuizSelection | null>(null);
  const [page, setPageState] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);

  const setPage = (next: number): void => {
    setPageState(next);
    setPicked([]);
  };

  const reset = async (bankId: string): Promise<void> => {
    const confirmed = await confirm({
      title: t('learn.quiz.resetTitle'),
      message: t('learn.quiz.resetMessage'),
      confirmLabel: t('learn.quiz.reset'),
      destructive: true,
    });
    if (!confirmed) return;
    await resetAttempt.mutateAsync(bankId).then(
      () => {
        toast.success(t('learn.quiz.resetDone'));
        if (selection?.bankId === bankId) setPage(0);
      },
      (error: unknown) => toast.error(error instanceof Error ? error.message : String(error)),
    );
  };

  return {
    selection,
    select: (next) => {
      setSelection(next);
      setPage(0);
    },
    page,
    setPage,
    picked,
    toggleOption: (index) => {
      setPicked((current) =>
        current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
      );
    },
    submit: (questionId) => {
      if (!selection || picked.length === 0) return;
      submitAnswer.mutate(
        { bankId: selection.bankId, questionId, selectedOptionIndices: picked },
        { onError: (error) => toast.error(error.message) },
      );
    },
    submitting: submitAnswer.isPending,
    reset: (bankId) => void reset(bankId),
  };
};
