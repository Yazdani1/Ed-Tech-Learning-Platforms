'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useLiveClasses } from '@/api/browse.api';
import { QueryState } from '@/components/common/QueryState';

import { LiveClassCard } from './LiveClassCard';
import { LiveClassFormModal } from './LiveClassFormModal';
import { useLiveClassActions } from './useLiveClassActions';

import type { LiveClassFormTarget } from './live-class.utils';
import type { ModalState } from '@/hooks/useModal';
import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassScheduleProps {
  courseId: string;
  /** The add/edit form; the tab's "Add Week" button opens it with `{}` */
  modal: ModalState<LiveClassFormTarget>;
  /** May the signed-in user edit, delete and add classes to this week (same rule as the backend) */
  canManage: (week: LiveClassWeek) => boolean;
  userId: string;
}

const LIST_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
  gap: 2.5,
  alignItems: 'start',
  m: 0,
  p: 0,
} as const;

/**
 * The live class weeks of a course (one column on phones, two from 1200 px) with the add/edit form. Used by
 * the course editor's Live Class tab and the course player's Live Class tab.
 */
export const LiveClassSchedule: FC<LiveClassScheduleProps> = ({
  courseId,
  modal,
  canManage,
  userId,
}) => {
  const { t } = useTranslation();
  const query = useLiveClasses(courseId);
  const actions = useLiveClassActions(courseId);
  const weeks = query.data ?? [];

  return (
    <>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={weeks.length === 0}
        emptyText={t('catalog.liveClass.empty')}
      >
        <Box component="ul" sx={LIST_SX}>
          {weeks.map((week, index) => (
            <LiveClassCard
              key={week._id}
              week={week}
              number={index + 1}
              userId={userId}
              canManage={canManage(week)}
              onEdit={(item) => {
                modal.openModal({ week: item });
              }}
              onDelete={actions.remove}
              onAddClass={(item) => {
                modal.openModal({ week: item, addClass: true });
              }}
            />
          ))}
        </Box>
      </QueryState>
      <LiveClassFormModal
        open={modal.open}
        target={modal.data}
        saving={actions.isSaving}
        onClose={modal.closeModal}
        onSave={(values) => {
          void actions.save(modal.data?.week, values).then((ok) => {
            if (ok) modal.closeModal();
          });
        }}
      />
    </>
  );
};
