'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { ExpertiseChips } from '../teachers/ExpertiseChips';
import { TeacherAvatar } from '../teachers/TeacherAvatar';

import type { TeacherProfile } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherMarqueeCardProps {
  teacher: TeacherProfile;
  /** Vertical offset (px) for the staggered look */
  offset: number;
  /** A repeated copy that only fills the loop: hidden from screen readers */
  isCopy: boolean;
}

const CARD_WIDTH = 230;
const HOVER_LIFT = 12;
const MAX_EXPERTISE = 2;

/** Small teacher card of the home page's scrolling instructors band. */
export const TeacherMarqueeCard: FC<TeacherMarqueeCardProps> = ({ teacher, offset, isCopy }) => (
  <Card
    elevation={0}
    aria-hidden={isCopy || undefined}
    sx={{
      width: CARD_WIDTH,
      minHeight: 292,
      flexShrink: 0,
      borderRadius: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: 1,
      borderColor: 'divider',
      transform: `translateY(${offset}px)`,
      transition: 'transform 0.4s ease, box-shadow 0.4s ease',
      boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
      '&:hover': {
        transform: `translateY(${offset - HOVER_LIFT}px) scale(1.04)`,
        boxShadow: '0 20px 48px rgba(15,23,42,0.18)',
      },
    }}
  >
    <TeacherAvatar teacher={teacher} bandHeight={92} size={88} />
    <Box sx={{ pt: 6.5, px: 2, pb: 2, textAlign: 'center' }}>
      <Typography variant="subtitle1" component="p" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
        {teacher.name}
      </Typography>
      <ExpertiseChips expertise={teacher.expertise} max={MAX_EXPERTISE} />
      {teacher.bio && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1.25,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {teacher.bio}
        </Typography>
      )}
    </Box>
  </Card>
);
