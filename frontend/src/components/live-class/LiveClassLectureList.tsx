'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatPlainDate, formatPlainTime } from '@/utils/dateTime';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassLectureListProps {
  lectures: LiveClassWeek['lectures'];
}

const ITEM_SX = { p: 1.5, borderColor: 'divider', bgcolor: 'grey.50' } as const;
const ROW_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 1,
  mb: 0.5,
} as const;

/** The classes of a week with their date and time (stored as written, shown as written). */
export const LiveClassLectureList: FC<LiveClassLectureListProps> = ({ lectures }) => {
  const { i18n } = useTranslation();
  return (
    <Stack
      component="ul"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        border: lectures.length ? 1 : 0,
        borderColor: 'divider',
        borderRadius: 0.5,
      }}
    >
      {lectures.map((lecture, index) => (
        <Box
          component="li"
          key={lecture._id ?? index}
          sx={{ ...ITEM_SX, borderTop: index > 0 ? 1 : 0 }}
        >
          <Box sx={ROW_SX}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
              {lecture.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<CalendarTodayIcon />}
                label={formatPlainDate(lecture.day, i18n.language)}
                size="small"
                color="info"
                variant="outlined"
              />
              <Chip
                icon={<AccessTimeIcon />}
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
      ))}
    </Stack>
  );
};
