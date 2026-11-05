'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatPlainDate, formatPlainTime } from '@/utils/dateTime';

import { SOFT_BG, SOFT_BORDER } from '../detail-styles';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassItemProps {
  lecture: LiveClassWeek['lectures'][number];
}

const PILL_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.5,
  py: 0.75,
  borderRadius: '8px',
  bgcolor: SOFT_BG,
  fontSize: '0.9rem',
} as const;
const ICON_SX = { fontSize: 17, color: '#2563eb' } as const;

/** One live class of a week: title, day and time (shown as written), description. */
export const LiveClassItem: FC<LiveClassItemProps> = ({ lecture }) => {
  const { i18n } = useTranslation();
  return (
    <Box component="li" sx={{ mx: { xs: 2, sm: 3 }, py: 2, borderTop: `1px solid ${SOFT_BORDER}` }}>
      <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', mb: 1 }}>{lecture.title}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={PILL_SX}>
          <CalendarTodayIcon sx={ICON_SX} aria-hidden />
          {formatPlainDate(lecture.day, i18n.language)}
        </Box>
        <Box sx={PILL_SX}>
          <AccessTimeIcon sx={ICON_SX} aria-hidden />
          {formatPlainTime(lecture.time, i18n.language)}
        </Box>
      </Box>
      {lecture.description && (
        <Typography variant="body2" sx={{ mt: 1, color: '#475569' }}>
          {lecture.description}
        </Typography>
      )}
    </Box>
  );
};
