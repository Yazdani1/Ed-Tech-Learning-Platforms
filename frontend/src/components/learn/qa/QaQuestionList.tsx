'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useQuestions } from '@/api/learn-qa.api';
import { ListPagination } from '@/components/common/ListPagination';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { TabSection } from '../common/TabSection';

import { countByFilter, filterQuestions, type QuestionFilter } from './qa.utils';
import { QaFilterBar } from './QaFilterBar';
import { QaQuestionFormModal } from './QaQuestionFormModal';
import { QaQuestionRows } from './QaQuestionRows';
import { useQaActions } from './useQaActions';

import type { QaQuestion } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaQuestionListProps {
  courseId: string;
  onOpen: (questionId: string) => void;
}

const PAGE_SIZE = 8;

/** Questions of the course with filters, paging and "Ask a Question" (everyone with access may ask). */
export const QaQuestionList: FC<QaQuestionListProps> = ({ courseId, onOpen }) => {
  const { t } = useTranslation();
  const questions = useQuestions(courseId);
  const actions = useQaActions(courseId);
  const modal = useModal<QaQuestion>();
  const [filter, setFilter] = useState<QuestionFilter>('unresolved');
  const [page, setPage] = useState(1);
  const all = questions.data ?? [];
  const shown = filterQuestions(all, filter);

  return (
    <TabSection
      title={t('learn.qa.title', { count: all.length })}
      actionLabel={t('learn.qa.ask')}
      onAction={() => {
        modal.openModal();
      }}
    >
      <QueryState
        isLoading={questions.isPending}
        error={questions.error}
        onRetry={() => void questions.refetch()}
        isEmpty={all.length === 0}
        emptyText={t('learn.qa.empty')}
      >
        <QaFilterBar
          value={filter}
          counts={countByFilter(all)}
          onChange={(next) => {
            setFilter(next);
            setPage(1);
          }}
        />
        <QaQuestionRows
          questions={shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          actions={actions}
          onOpen={onOpen}
          onEdit={modal.openModal}
        />
        <ListPagination page={page} limit={PAGE_SIZE} total={shown.length} onPageChange={setPage} />
      </QueryState>
      <QaQuestionFormModal
        courseId={courseId}
        open={modal.open}
        item={modal.data}
        onClose={modal.closeModal}
      />
    </TabSection>
  );
};
