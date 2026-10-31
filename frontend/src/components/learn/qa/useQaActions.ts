'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteQaItem, useResolveQuestion, useUpvoteQuestion } from '@/api/learn-qa.api';

import { useDeleteWithConfirm } from '../common/useDeleteWithConfirm';

import type { QaQuestion } from '@/schemas/learn.schema';

export interface QaActions {
  upvote: (question: QaQuestion) => void;
  resolve: (question: QaQuestion) => void;
  /** The question being resolved / reopened right now */
  resolvingId: string | undefined;
  remove: (question: QaQuestion, onDeleted?: () => void) => void;
}

/** Upvote, resolve / reopen and delete (with confirmation) a question, with toasts. */
export const useQaActions = (courseId: string): QaActions => {
  const { t } = useTranslation();
  const upvote = useUpvoteQuestion(courseId);
  const resolve = useResolveQuestion(courseId);
  const deleteItem = useDeleteQaItem(courseId);
  const remove = useDeleteWithConfirm(deleteItem, t('learn.qa.questionDeleted'));

  return {
    upvote: (question) => {
      upvote.mutate(question._id, { onError: (error) => toast.error(error.message) });
    },
    resolve: (question) => {
      const isResolved = !question.isResolved;
      void resolve.mutateAsync({ id: question._id, isResolved }).then(
        () => toast.success(t(isResolved ? 'learn.qa.markedSolved' : 'learn.qa.reopened')),
        (error: unknown) => toast.error(error instanceof Error ? error.message : String(error)),
      );
    },
    resolvingId: resolve.isPending ? resolve.variables.id : undefined,
    remove: (question, onDeleted) => {
      remove(
        question.title,
        { kind: 'questions', id: question._id, questionId: question._id },
        onDeleted,
      );
    },
  };
};
