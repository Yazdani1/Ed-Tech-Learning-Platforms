'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { useQuestion } from '@/api/learn-qa.api';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { QaAnswerFormModal } from './QaAnswerFormModal';
import { QaAnswerList } from './QaAnswerList';
import { QaQuestionCard } from './QaQuestionCard';
import { QaQuestionFormModal } from './QaQuestionFormModal';

import type { QaAnswer, QaQuestion } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaQuestionDetailViewProps {
  courseId: string;
  questionId: string;
  onBack: () => void;
}

/** One question with its answers: vote, resolve, edit/delete, and "Add Answer". */
export const QaQuestionDetailView: FC<QaQuestionDetailViewProps> = ({
  courseId,
  questionId,
  onBack,
}) => {
  const { t } = useTranslation();
  const detail = useQuestion(questionId);
  const questionModal = useModal<QaQuestion>();
  const answerModal = useModal<QaAnswer>();

  return (
    <Box component="section" aria-label={t('learn.qa.questionLabel')}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2, minHeight: 44 }}>
        {t('learn.qa.back')}
      </Button>
      <QueryState
        isLoading={detail.isPending}
        error={detail.error}
        onRetry={() => void detail.refetch()}
      >
        {detail.data && (
          <>
            <QaQuestionCard
              courseId={courseId}
              question={detail.data.question}
              onEdit={() => {
                questionModal.openModal(detail.data.question);
              }}
              onDeleted={onBack}
            />
            <QaAnswerList
              courseId={courseId}
              questionId={questionId}
              answers={detail.data.answers}
              onEdit={answerModal.openModal}
              onAdd={() => {
                answerModal.openModal();
              }}
            />
          </>
        )}
      </QueryState>
      <QaQuestionFormModal
        courseId={courseId}
        open={questionModal.open}
        item={questionModal.data}
        onClose={questionModal.closeModal}
      />
      <QaAnswerFormModal
        courseId={courseId}
        questionId={questionId}
        open={answerModal.open}
        item={answerModal.data}
        onClose={answerModal.closeModal}
      />
    </Box>
  );
};
