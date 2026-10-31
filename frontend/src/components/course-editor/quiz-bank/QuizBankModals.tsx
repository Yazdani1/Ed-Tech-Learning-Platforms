'use client';

import { useTranslation } from 'react-i18next';

import { TitleFormModal } from '../common/TitleFormModal';

import { BankFormModal } from './BankFormModal';
import { QuestionFormModal } from './QuestionFormModal';

import type { QuizBankUi } from './useQuizBankUi';
import type { FC } from 'react';

interface QuizBankModalsProps {
  ui: QuizBankUi;
}

/** The section, bank and question dialogs of the quiz bank tab (each closes after a successful save). */
export const QuizBankModals: FC<QuizBankModalsProps> = ({ ui }) => {
  const { t } = useTranslation();
  const { actions, sectionModal, bankModal, questionModal } = ui;
  const editingSection = sectionModal.data;

  const closeOn = (close: () => void) => (ok: boolean) => {
    if (ok) close();
  };

  return (
    <>
      <TitleFormModal
        open={sectionModal.open}
        title={t(editingSection ? 'catalog.quiz.renameSection' : 'catalog.quiz.addSection')}
        fieldLabel={t('catalog.quiz.sectionTitle')}
        initialValue={editingSection?.title}
        saveLabel={editingSection ? t('common.save') : t('common.create')}
        saving={actions.isSavingSection}
        onClose={sectionModal.closeModal}
        onSave={(title) => {
          void actions.saveSection(editingSection, title).then(closeOn(sectionModal.closeModal));
        }}
      />
      <BankFormModal
        open={bankModal.open}
        bank={bankModal.data?.bank}
        saving={actions.isSavingBank}
        onClose={bankModal.closeModal}
        onSave={(values) => {
          const target = bankModal.data;
          if (!target) return;
          void actions
            .saveBank(target.sectionId, target.bank, values)
            .then(closeOn(bankModal.closeModal));
        }}
      />
      <QuestionFormModal
        open={questionModal.open}
        question={questionModal.data?.question}
        saving={actions.isSavingQuestion}
        onClose={questionModal.closeModal}
        onSave={(values) => {
          const target = questionModal.data;
          if (!target) return;
          void actions
            .saveQuestion(target.bankId, target.question, values)
            .then(closeOn(questionModal.closeModal));
        }}
      />
    </>
  );
};
