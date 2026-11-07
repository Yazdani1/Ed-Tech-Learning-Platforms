'use client';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import type { Course } from '@/schemas/browse.schema';
import type { FC, ReactNode } from 'react';

interface CourseScheduleFactsProps {
  course: Course;
}

const ICON_SX = { fontSize: 18, color: 'primary.main', mt: 0.25 } as const;

/** In the enrolment card, for everyone: class start date, live class schedule and support class schedule (when set). */
export const CourseScheduleFacts: FC<CourseScheduleFactsProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  const facts: { key: string; icon: ReactNode; label: string; value: string }[] = [];
  if (course.startDate)
    facts.push({
      key: 'start',
      icon: <CalendarTodayIcon sx={ICON_SX} />,
      label: t('browse.enroll.classStart'),
      value: formatDate(course.startDate, i18n.language),
    });
  if (course.liveClassSchedule?.trim())
    facts.push({
      key: 'live',
      icon: <VideocamOutlinedIcon sx={ICON_SX} />,
      label: t('browse.enroll.liveSchedule'),
      value: course.liveClassSchedule.trim(),
    });
  if (course.supportClassSchedule?.trim())
    facts.push({
      key: 'support',
      icon: <SupportAgentIcon sx={ICON_SX} />,
      label: t('browse.enroll.supportSchedule'),
      value: course.supportClassSchedule.trim(),
    });
  if (facts.length === 0) return null;
  return (
    <Box
      component="ul"
      aria-label={t('browse.enroll.scheduleLabel')}
      sx={{ listStyle: 'none', p: 0, m: 0, mb: 2, display: 'grid', gap: 1.25 }}
    >
      {facts.map((fact) => (
        <Box
          component="li"
          key={fact.key}
          sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}
        >
          <Box aria-hidden sx={{ display: 'flex' }}>
            {fact.icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', fontWeight: 700 }}
            >
              {fact.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}
            >
              {fact.value}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
