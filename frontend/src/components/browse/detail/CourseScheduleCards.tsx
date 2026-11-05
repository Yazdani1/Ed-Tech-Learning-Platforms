'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { SIDE_CARD_SX } from './detail-styles';
import { useScheduleItems } from './useScheduleItems';

import type { Course, LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseScheduleCardsProps {
  course: Course;
  weeks: readonly LiveClassWeek[];
}

const BAR = 'linear-gradient(90deg, #2563eb, #10b981, #f59e0b)';
const LABEL_SX = {
  color: '#475569',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
} as const;

/** Start date, next live class and end date, in cards with a gradient border; hidden when there are none. */
export const CourseScheduleCards: FC<CourseScheduleCardsProps> = ({ course, weeks }) => {
  const items = useScheduleItems(course, weeks);
  if (items.length === 0) return null;

  return (
    <Paper variant="outlined" sx={SIDE_CARD_SX}>
      <Box sx={{ height: 6, background: BAR }} />
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: `repeat(${String(items.length)}, minmax(0, 1fr))` },
        }}
      >
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: '2px solid transparent',
              borderRadius: '14px',
              background: `linear-gradient(#fff, #fff) padding-box, ${item.border} border-box`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              {item.icon}
              <Typography variant="caption" sx={LABEL_SX}>
                {item.label}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.4 }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
