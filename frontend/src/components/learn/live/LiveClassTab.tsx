'use client';

import { useTranslation } from 'react-i18next';

import { useLiveClasses } from '@/api/browse.api';
import { LiveClassSchedule } from '@/components/live-class/LiveClassSchedule';
import { useModal } from '@/hooks/useModal';

import { TabSection } from '../common/TabSection';
import { useLearnPermissions } from '../useLearnPermissions';

import type { LiveClassFormTarget } from '@/components/live-class/live-class.utils';
import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassTabProps {
  courseId: string;
}

const TAB_MAX_WIDTH = 1120;

/**
 * Weekly live-class plans (oldest first). Super Admin, Admin and the course's teachers add weeks; a week is
 * edited or deleted by its author or a staff admin (same rules as the backend). Students only read.
 */
export const LiveClassTab: FC<LiveClassTabProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  const weeks = useLiveClasses(courseId);
  const modal = useModal<LiveClassFormTarget>();
  const canManage = (week: LiveClassWeek): boolean =>
    !permissions.isStudent && permissions.canManage(week.postedBy);

  return (
    <TabSection
      title={t('learn.live.title', { count: weeks.data?.length ?? 0 })}
      actionLabel={permissions.canPostLiveClass ? t('learn.live.add') : undefined}
      onAction={() => {
        modal.openModal({});
      }}
      maxWidth={TAB_MAX_WIDTH}
    >
      <LiveClassSchedule
        courseId={courseId}
        modal={modal}
        canManage={canManage}
        userId={permissions.userId}
      />
    </TabSection>
  );
};
