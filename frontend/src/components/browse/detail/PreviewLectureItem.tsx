'use client';

import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import type { CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PreviewLectureItemProps {
  lecture: CourseLecture;
  active: boolean;
  onSelect: (lecture: CourseLecture) => void;
}

const ACTIVE_COLOR = '#a78bfa';
const ITEM_SX = {
  px: 2,
  py: 1.25,
  gap: 1.25,
  minHeight: 48,
  borderBottom: '1px solid #2a2a2a',
  '&.Mui-selected': { bgcolor: '#7c3aed22' },
} as const;

/** One free preview in the player's side list (the playing one is highlighted). */
export const PreviewLectureItem: FC<PreviewLectureItemProps> = ({ lecture, active, onSelect }) => {
  const Icon = active ? PlayCircleFilledIcon : PlayCircleOutlinedIcon;
  return (
    <ListItemButton
      selected={active}
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        onSelect(lecture);
      }}
      sx={ITEM_SX}
    >
      <Icon sx={{ fontSize: 20, color: active ? ACTIVE_COLOR : 'grey.500' }} aria-hidden />
      <ListItemText
        primary={lecture.title}
        slotProps={{
          primary: {
            sx: {
              fontSize: '0.82rem',
              fontWeight: active ? 700 : 400,
              color: active ? ACTIVE_COLOR : '#d1d5db',
            },
          },
        }}
      />
    </ListItemButton>
  );
};
