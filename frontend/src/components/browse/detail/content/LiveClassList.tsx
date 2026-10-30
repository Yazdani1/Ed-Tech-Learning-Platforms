'use client';

import Stack from '@mui/material/Stack';

import { LiveClassWeekCard } from './LiveClassWeekCard';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassListProps {
  weeks: readonly LiveClassWeek[];
  expanded: readonly string[];
  onToggle: (weekId: string, open: boolean) => void;
}

/** The live-class plan: one card per week. */
export const LiveClassList: FC<LiveClassListProps> = ({ weeks, expanded, onToggle }) => (
  <Stack spacing={2.5}>
    {weeks.map((week, index) => (
      <LiveClassWeekCard
        key={week._id}
        week={week}
        index={index}
        expanded={expanded.includes(week._id)}
        onToggle={(open) => {
          onToggle(week._id, open);
        }}
      />
    ))}
  </Stack>
);
