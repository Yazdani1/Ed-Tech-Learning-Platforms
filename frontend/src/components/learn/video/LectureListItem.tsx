'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { formatLectureDuration } from '@/components/browse/course-utils';

import { isPlayable } from '../learn.utils';

import type { CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LectureListItemProps {
  lecture: CourseLecture;
  active: boolean;
  onSelect: (lectureId: string) => void;
}

/** One lecture of the content list; lectures without a playable video cannot be chosen. */
export const LectureListItem: FC<LectureListItemProps> = ({ lecture, active, onSelect }) => {
  const playable = isPlayable(lecture);
  const Icon = active ? PlayCircleFilledIcon : playable ? PlayCircleOutlinedIcon : LockOutlinedIcon;
  return (
    <ListItemButton
      selected={active}
      disabled={!playable}
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        onSelect(lecture._id);
      }}
      sx={{
        minHeight: 48,
        alignItems: 'flex-start',
        bgcolor: active ? undefined : 'background.paper',
      }}
    >
      <ListItemIcon
        sx={{ minWidth: 30, mt: 0.5, color: active ? 'primary.main' : 'text.secondary' }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </ListItemIcon>
      <ListItemText
        primary={lecture.title}
        secondary={formatLectureDuration(lecture.duration) || undefined}
        slotProps={{
          primary: {
            sx: {
              fontSize: '0.82rem',
              fontWeight: active ? 700 : 400,
              color: active ? 'primary.main' : undefined,
            },
          },
        }}
      />
    </ListItemButton>
  );
};
