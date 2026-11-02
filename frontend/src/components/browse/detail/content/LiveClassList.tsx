'use client';

import Box from '@mui/material/Box';

import { LiveClassWeekCard } from './LiveClassWeekCard';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassListProps {
  weeks: readonly LiveClassWeek[];
  expanded: readonly string[];
  onToggle: (weekId: string, open: boolean) => void;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  gap: 2.5,
  alignItems: 'start',
} as const;

/** The live-class plan: one card per week, two per row from tablet width. */
export const LiveClassList: FC<LiveClassListProps> = ({ weeks, expanded, onToggle }) => (
  <Box sx={GRID_SX}>
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
  </Box>
);
