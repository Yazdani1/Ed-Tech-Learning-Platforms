'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useLiveClasses } from '@/api/browse.api';
import { CourseCover } from '@/components/course-card/CourseCover';
import { localizeDigits } from '@/utils/price';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PaymentCourseHeaderProps {
  course: Course;
}

const THUMB_SIZE = 64;
const TYPE_CHIP_SX = {
  display: 'inline-block',
  px: 1,
  py: 0.25,
  mb: 0.5,
  borderRadius: 99,
  bgcolor: '#d1fae5',
  color: '#065f46',
  fontSize: '0.75rem',
  fontWeight: 700,
} as const;
const TITLE_SX = {
  fontWeight: 700,
  fontSize: '1.1rem',
  lineHeight: 1.3,
  overflowWrap: 'anywhere',
} as const;

/** Top of the order summary: cover, course type, title, and the weeks and live sessions of the plan. */
export const PaymentCourseHeader: FC<PaymentCourseHeaderProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  const weeks = useLiveClasses(course._id).data ?? [];
  const classCount = weeks.reduce((total, week) => total + week.lectures.length, 0);
  const length = [
    t('payment.weeks', { count: weeks.length }),
    t('payment.sessions', { count: classCount }),
  ].join(' • ');

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
      <Box sx={{ width: THUMB_SIZE, flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
        <CourseCover src={course.coverImage} alt="" height={THUMB_SIZE} sizes="64px" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {course.courseType && <Box sx={TYPE_CHIP_SX}>{course.courseType.name}</Box>}
        <Typography component="h2" sx={TITLE_SX}>
          {course.title}
        </Typography>
        {weeks.length > 0 && (
          <Typography
            variant="body2"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: '#475569' }}
          >
            <AccessTimeIcon sx={{ fontSize: 16 }} aria-hidden />
            {localizeDigits(length, i18n.language)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
