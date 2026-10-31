'use client';

import { useTranslation } from 'react-i18next';

import { useContentList, useDeleteContent } from '@/api/learn.api';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { PostList } from '../common/PostList';
import { TabSection } from '../common/TabSection';
import { useDeleteWithConfirm } from '../common/useDeleteWithConfirm';
import { useLearnPermissions } from '../useLearnPermissions';

import { AnnouncementFormModal } from './AnnouncementFormModal';

import type { Announcement } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface AnnouncementsTabProps {
  courseId: string;
}

/** Course announcements, newest first; staff admins and the course's teachers post, edit and delete. */
export const AnnouncementsTab: FC<AnnouncementsTabProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  const list = useContentList('announcements', courseId);
  const modal = useModal<Announcement>();
  const remove = useDeleteWithConfirm(
    useDeleteContent('announcements', courseId),
    t('learn.announcements.deleted'),
  );
  const items = list.data ?? [];

  return (
    <TabSection
      title={t('learn.announcements.title', { count: items.length })}
      actionLabel={permissions.canPostContent ? t('learn.announcements.add') : undefined}
      onAction={() => {
        modal.openModal();
      }}
    >
      <QueryState
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        isEmpty={items.length === 0}
        emptyText={t('learn.announcements.empty')}
      >
        <PostList
          items={items}
          onEdit={modal.openModal}
          onDelete={(item) => {
            remove(item.title, item._id);
          }}
        />
      </QueryState>
      <AnnouncementFormModal
        courseId={courseId}
        open={modal.open}
        item={modal.data}
        onClose={modal.closeModal}
      />
    </TabSection>
  );
};
