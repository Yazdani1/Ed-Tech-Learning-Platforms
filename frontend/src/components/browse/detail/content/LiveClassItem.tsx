'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatPlainDate, formatPlainTime } from '@/utils/dateTime';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassItemProps {
  lecture: LiveClassWeek['lectures'][number];
}

/** One live class of a week: title, day and time chips (shown as written), description. */
export const LiveClassItem: FC<LiveClassItemProps> = ({ lecture }) => {
  const { i18n } = useTranslation();
  return (
    <Box
      component="li"
      sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 1,
          mb: 0.75,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {lecture.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
            label={formatPlainDate(lecture.day, i18n.language)}
            size="small"
            sx={{ bgcolor: '#e0f2fe', color: '#075985', fontWeight: 700, borderRadius: 1 }}
          />
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
            label={formatPlainTime(lecture.time, i18n.language)}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>
      {lecture.description && (
        <Typography variant="body2" color="text.secondary">
          {lecture.description}
        </Typography>
      )}
    </Box>
  );
};
