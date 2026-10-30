'use client';

import Box from '@mui/material/Box';

import { TeacherMarqueeCard } from './TeacherMarqueeCard';

import type { TeacherProfile } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherMarqueeRowProps {
  teachers: TeacherProfile[];
  /** How many cards are the real list (the rest are loop copies) */
  uniqueCount: number;
  direction: 'left' | 'right';
  durationSeconds: number;
}

const OFFSET_UP = -20;
const OFFSET_DOWN = 30;

/** One endlessly scrolling row (the list twice, moved by half its width). Pauses on hover. */
export const TeacherMarqueeRow: FC<TeacherMarqueeRowProps> = ({
  teachers,
  uniqueCount,
  direction,
  durationSeconds,
}) => {
  const animation = direction === 'left' ? 'publicMarqueeLeft' : 'publicMarqueeRight';
  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 3, md: 6 },
        width: 'max-content',
        py: 4,
        pl: 4,
        animation: `${animation} ${durationSeconds}s linear infinite`,
        '&:hover': { animationPlayState: 'paused' },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        '@keyframes publicMarqueeLeft': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        '@keyframes publicMarqueeRight': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
      }}
    >
      {teachers.map((teacher, index) => {
        const even = index % 2 === 0;
        const offset =
          direction === 'left' ? (even ? OFFSET_UP : OFFSET_DOWN) : even ? OFFSET_DOWN : OFFSET_UP;
        return (
          <TeacherMarqueeCard
            key={`${teacher._id}-${index}`}
            teacher={teacher}
            offset={offset}
            isCopy={direction === 'right' || index >= uniqueCount}
          />
        );
      })}
    </Box>
  );
};
