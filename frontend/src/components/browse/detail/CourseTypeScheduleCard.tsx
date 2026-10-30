'use client';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import { COURSE_TYPE_GRADIENT } from '../card/CourseTypeBadge';

import { CourseTypeBlock } from './CourseTypeBlock';
import { DateItem } from './DateItem';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseTypeScheduleCardProps {
  course: Course;
}

const CARD_SX = {
  mb: 4,
  borderRadius: 2,
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: '0 2px 12px rgba(15,118,110,0.08)',
} as const;

/** Course type (name + description) and start / end dates; hidden when the course has none of them. */
export const CourseTypeScheduleCard: FC<CourseTypeScheduleCardProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  const { courseType, startDate, endDate } = course;
  if (!courseType && !startDate && !endDate) return null;
  const hasDates = Boolean(startDate) || Boolean(endDate);

  return (
    <Box sx={CARD_SX}>
      <Box sx={{ height: 5, background: COURSE_TYPE_GRADIENT }} />
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {courseType && (
          <Box sx={{ mb: hasDates ? 2.5 : 0 }}>
            <CourseTypeBlock courseType={courseType} />
          </Box>
        )}
        {courseType && hasDates && <Divider sx={{ mb: 2.5 }} />}
        {hasDates && (
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {startDate && (
              <DateItem
                label={t('browse.detail.startDate')}
                value={formatDate(startDate, i18n.language)}
                icon={<CalendarTodayIcon sx={{ fontSize: 18, color: '#0f766e' }} />}
              />
            )}
            {endDate && (
              <DateItem
                label={t('browse.detail.endDate')}
                value={formatDate(endDate, i18n.language)}
                icon={<EventIcon sx={{ fontSize: 18, color: '#7c3aed' }} />}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
