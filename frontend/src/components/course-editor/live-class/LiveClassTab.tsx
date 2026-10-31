'use client';

import Box from '@mui/material/Box';

import { useLiveClasses } from '@/api/browse.api';
import { LiveClassSchedule } from '@/components/live-class/LiveClassSchedule';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';

import { LiveClassTabHeader } from './LiveClassTabHeader';

import type { LiveClassFormTarget } from '@/components/live-class/live-class.utils';
import type { FC } from 'react';

interface LiveClassTabProps {
  courseId: string;
}

const TAB_MAX_WIDTH = 1040;
/** The editor is Super Admin and Admin only: they manage every week. */
const canManageAll = (): boolean => true;

/** Weekly live class plans of the course (study curricula): add, edit, delete, add a class to a week. */
export const LiveClassTab: FC<LiveClassTabProps> = ({ courseId }) => {
  const { user } = useAuth();
  const weeks = useLiveClasses(courseId);
  const modal = useModal<LiveClassFormTarget>();

  return (
    <Box sx={{ maxWidth: TAB_MAX_WIDTH }}>
      <LiveClassTabHeader
        count={weeks.data?.length ?? 0}
        onAdd={() => {
          modal.openModal({});
        }}
      />
      <LiveClassSchedule
        courseId={courseId}
        modal={modal}
        canManage={canManageAll}
        userId={user?._id ?? ''}
      />
    </Box>
  );
};
