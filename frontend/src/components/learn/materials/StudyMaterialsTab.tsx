'use client';

import { useTranslation } from 'react-i18next';

import { useContentList, useDeleteContent } from '@/api/learn.api';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { PostList } from '../common/PostList';
import { TabSection } from '../common/TabSection';
import { useDeleteWithConfirm } from '../common/useDeleteWithConfirm';
import { useLearnPermissions } from '../useLearnPermissions';

import { StudyMaterialFormModal } from './StudyMaterialFormModal';

import type { StudyMaterial } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface StudyMaterialsTabProps {
  courseId: string;
}

/** Study materials (notes and links), newest first; staff admins and the course's teachers manage them. */
export const StudyMaterialsTab: FC<StudyMaterialsTabProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  const list = useContentList('materials', courseId);
  const modal = useModal<StudyMaterial>();
  const remove = useDeleteWithConfirm(
    useDeleteContent('materials', courseId),
    t('learn.materials.deleted'),
  );
  const items = list.data ?? [];

  return (
    <TabSection
      title={t('learn.materials.title', { count: items.length })}
      actionLabel={permissions.canPostContent ? t('learn.materials.add') : undefined}
      onAction={() => {
        modal.openModal();
      }}
    >
      <QueryState
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        isEmpty={items.length === 0}
        emptyText={t('learn.materials.empty')}
      >
        <PostList
          items={items}
          onEdit={modal.openModal}
          onDelete={(item) => {
            remove(item.title, item._id);
          }}
        />
      </QueryState>
      <StudyMaterialFormModal
        courseId={courseId}
        open={modal.open}
        item={modal.data}
        onClose={modal.closeModal}
      />
    </TabSection>
  );
};
