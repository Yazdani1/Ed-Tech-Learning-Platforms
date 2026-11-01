'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/hooks/useConfirm';
import { toastError } from '@/utils/toast-error';

import type { PracticeAnswers } from './usePracticeAnswers';
import type { QuizBank } from '@/schemas/quiz.schema';

export interface PracticeActions {
  check: (bankId: string, questionId: string, selected: number[]) => void;
  /** Asks first, then clears the bank's answers; `onDone` runs after a successful reset */
  reset: (bank: QuizBank, onDone: () => void) => void;
}

/** "Check Answer" and "Reset" with their confirmation and toasts. */
export const usePracticeActions = (practice: PracticeAnswers): PracticeActions => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const reset = async (bank: QuizBank, onDone: () => void): Promise<void> => {
    const confirmed = await confirm({
      title: t('quiz.common.resetTitle'),
      message: t('quiz.common.resetMessage'),
      confirmLabel: t('quiz.common.reset'),
      destructive: true,
    });
    if (!confirmed) return;
    await practice
      .reset(
        bank._id,
        bank.questions.map((question) => question._id),
      )
      .then(() => {
        toast.success(t('quiz.common.resetDone'));
        onDone();
      }, toastError);
  };

  return {
    check: (bankId, questionId, selected) => {
      practice.check(bankId, questionId, selected).catch(toastError);
    },
    reset: (bank, onDone) => void reset(bank, onDone),
  };
};
