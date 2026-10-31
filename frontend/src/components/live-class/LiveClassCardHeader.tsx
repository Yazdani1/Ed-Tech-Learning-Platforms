'use client';

import EventIcon from '@mui/icons-material/Event';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { WeekBadge } from './WeekBadge';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC, ReactNode } from 'react';

interface LiveClassCardHeaderProps {
  week: LiveClassWeek;
  /** 1-based position ("Week 1") */
  number: number;
  /** The week's title, else its week name, else "Week N" */
  name: string;
  /** The "⋮" menu (only for users who may manage the week) */
  menu?: ReactNode;
}

/** Week badge, title, week name, number of classes and the actions menu of a live class card. */
export const LiveClassCardHeader: FC<LiveClassCardHeaderProps> = ({ week, number, name, menu }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
      <WeekBadge number={number} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 800, wordBreak: 'break-word' }}
        >
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {week.weekName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <EventIcon sx={{ fontSize: 17 }} aria-hidden />
          <Typography variant="caption" sx={{ fontWeight: 800 }}>
            {t('catalog.liveClass.classCount', { count: week.lectures.length })}
          </Typography>
        </Box>
      </Box>
      {menu}
    </Box>
  );
};
