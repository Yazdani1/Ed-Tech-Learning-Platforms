'use client';

import { useState } from 'react';

import { useModal, type ModalState } from '@/hooks/useModal';

import { useQuizBankActions, type QuizBankActions } from './useQuizBankActions';

import type { QuizSidebarHandlers } from './QuizSectionBlock';
import type { QuizBank, QuizQuestion, QuizSection } from '@/schemas/quiz.schema';

export interface BankTarget {
  sectionId: string;
  bank?: QuizBank;
}

export interface QuestionTarget {
  bankId: string;
  question?: QuizQuestion;
}

export interface QuizBankUi {
  actions: QuizBankActions;
  managingBank: QuizBank | undefined;
  closeBank: () => void;
  sectionModal: ModalState<QuizSection>;
  bankModal: ModalState<BankTarget>;
  questionModal: ModalState<QuestionTarget>;
  handlers: QuizSidebarHandlers;
}

/** Which bank is open and which dialog is showing, wired to the quiz management actions. */
export const useQuizBankUi = (courseId: string, banks: QuizBank[]): QuizBankUi => {
  const actions = useQuizBankActions(courseId);
  const [managingBankId, setManagingBankId] = useState<string | null>(null);
  const sectionModal = useModal<QuizSection>();
  const bankModal = useModal<BankTarget>();
  const questionModal = useModal<QuestionTarget>();
  const managingBank = banks.find((bank) => bank._id === managingBankId);

  const handlers: QuizSidebarHandlers = {
    onManage: (bank) => {
      setManagingBankId(bank._id);
    },
    onRenameSection: sectionModal.openModal,
    onDeleteSection: (section) => {
      void actions.deleteSection(section).then((ok) => {
        if (ok && managingBank?.quizSection === section._id) setManagingBankId(null);
      });
    },
    onToggleSectionPreview: actions.toggleSectionPreview,
    onAddBank: (section) => {
      bankModal.openModal({ sectionId: section._id });
    },
    onEditBank: (bank) => {
      setManagingBankId(bank._id);
      bankModal.openModal({ sectionId: bank.quizSection ?? '', bank });
    },
    onDeleteBank: (bank) => {
      void actions.deleteBank(bank).then((ok) => {
        if (ok && bank._id === managingBankId) setManagingBankId(null);
      });
    },
    onToggleBankPreview: actions.toggleBankPreview,
  };

  return {
    actions,
    managingBank,
    closeBank: () => {
      setManagingBankId(null);
    },
    sectionModal,
    bankModal,
    questionModal,
    handlers,
  };
};
