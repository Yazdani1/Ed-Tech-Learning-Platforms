'use client';

import { useTranslation } from 'react-i18next';

import {
  useCreateQuizBank,
  useCreateQuizSection,
  useDeleteQuestion,
  useDeleteQuizBank,
  useDeleteQuizSection,
  useSaveQuestion,
  useUpdateQuizBank,
  useUpdateQuizSection,
  type QuestionBody,
} from '@/api/course-editor.api';
import { useConfirm } from '@/hooks/useConfirm';

import { useToastResult } from '@/hooks/useToastResult';

import type { BankForm, QuestionForm } from '@/schemas/course-editor.schema';
import type { QuizBank, QuizQuestion, QuizSection } from '@/schemas/quiz.schema';

export interface QuizBankActions {
  saveSection: (section: QuizSection | undefined, title: string) => Promise<boolean>;
  toggleSectionPreview: (section: QuizSection) => void;
  deleteSection: (section: QuizSection) => Promise<boolean>;
  saveBank: (sectionId: string, bank: QuizBank | undefined, values: BankForm) => Promise<boolean>;
  toggleBankPreview: (bank: QuizBank) => void;
  deleteBank: (bank: QuizBank) => Promise<boolean>;
  saveQuestion: (
    bankId: string,
    question: QuizQuestion | undefined,
    values: QuestionForm,
  ) => Promise<boolean>;
  deleteQuestion: (bankId: string, question: QuizQuestion) => void;
  isSavingSection: boolean;
  isSavingBank: boolean;
  isSavingQuestion: boolean;
}

const toQuestionBody = (values: QuestionForm): QuestionBody => ({
  question: values.question,
  options: values.options.map((option) => ({
    text: option.text,
    explanation: option.explanation || undefined,
  })),
  correctOptionIndices: [...values.correctOptionIndices].sort((a, b) => a - b),
});

/** Shared helpers: run with a toast, confirm a delete (texts catalog.quiz.<key>Title / Message). */
const useQuizHelpers = () => {
  const { t } = useTranslation();
  const run = useToastResult();
  const confirm = useConfirm();
  const confirmDelete = (key: string, work: () => Promise<unknown>, done: string) =>
    confirm({
      title: t(`catalog.quiz.${key}Title`),
      message: t(`catalog.quiz.${key}Message`),
      confirmLabel: t('common.delete'),
      destructive: true,
    }).then((ok) => (ok ? run(work(), t(done)) : false));
  const previewToast = (on: boolean): string =>
    t(on ? 'catalog.quiz.previewOn' : 'catalog.quiz.previewOff');
  return { t, run, confirmDelete, previewToast };
};

const useSectionActions = (courseId: string) => {
  const { t, run, confirmDelete, previewToast } = useQuizHelpers();
  const create = useCreateQuizSection(courseId);
  const update = useUpdateQuizSection(courseId);
  const remove = useDeleteQuizSection(courseId);
  return {
    saveSection: (section: QuizSection | undefined, title: string) =>
      section
        ? run(
            update.mutateAsync({ id: section._id, body: { title } }),
            t('catalog.quiz.sectionUpdated'),
          )
        : run(create.mutateAsync(title), t('catalog.quiz.sectionCreated')),
    toggleSectionPreview: (section: QuizSection) => {
      const on = !section.isFreePreview;
      void run(
        update.mutateAsync({ id: section._id, body: { isFreePreview: on } }),
        previewToast(on),
      );
    },
    deleteSection: (section: QuizSection) =>
      confirmDelete(
        'deleteSection',
        () => remove.mutateAsync(section._id),
        'catalog.quiz.sectionDeleted',
      ),
    isSavingSection: create.isPending || update.isPending,
  };
};

const useBankActions = (courseId: string) => {
  const { t, run, confirmDelete, previewToast } = useQuizHelpers();
  const create = useCreateQuizBank(courseId);
  const update = useUpdateQuizBank(courseId);
  const remove = useDeleteQuizBank(courseId);
  return {
    saveBank: (sectionId: string, bank: QuizBank | undefined, values: BankForm) =>
      bank
        ? run(update.mutateAsync({ id: bank._id, body: values }), t('catalog.quiz.bankUpdated'))
        : run(
            create.mutateAsync({
              quizSection: sectionId,
              title: values.title,
              description: values.description || undefined,
            }),
            t('catalog.quiz.bankCreated'),
          ),
    toggleBankPreview: (bank: QuizBank) => {
      const on = !bank.isFreePreview;
      void run(update.mutateAsync({ id: bank._id, body: { isFreePreview: on } }), previewToast(on));
    },
    deleteBank: (bank: QuizBank) =>
      confirmDelete('deleteBank', () => remove.mutateAsync(bank._id), 'catalog.quiz.bankDeleted'),
    isSavingBank: create.isPending || update.isPending,
  };
};

const useQuestionActions = (courseId: string) => {
  const { t, run, confirmDelete } = useQuizHelpers();
  const save = useSaveQuestion(courseId);
  const remove = useDeleteQuestion(courseId);
  return {
    saveQuestion: (bankId: string, question: QuizQuestion | undefined, values: QuestionForm) =>
      run(
        save.mutateAsync({ bankId, questionId: question?._id, body: toQuestionBody(values) }),
        t(question ? 'catalog.quiz.questionUpdated' : 'catalog.quiz.questionAdded'),
      ),
    deleteQuestion: (bankId: string, question: QuizQuestion) => {
      void confirmDelete(
        'deleteQuestion',
        () => remove.mutateAsync({ bankId, questionId: question._id }),
        'catalog.quiz.questionDeleted',
      );
    },
    isSavingQuestion: save.isPending,
  };
};

/** Every quiz management change, with confirmations for deletes and a toast for the result. */
export const useQuizBankActions = (courseId: string): QuizBankActions => {
  const sections = useSectionActions(courseId);
  const banks = useBankActions(courseId);
  const questions = useQuestionActions(courseId);
  return { ...sections, ...banks, ...questions };
};
