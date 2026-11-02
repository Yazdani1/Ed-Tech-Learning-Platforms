'use client';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseThumb } from '@/components/course-picker/CourseThumb';

import { COURSE_REVENUE_COLOR, formatMoney } from '../insights.utils';

import type { TopCourse } from '@/schemas/insights.schema';
import type { FC } from 'react';

const COVER_WIDTH = 80;
const PERCENT = 100;
const BAR_HEIGHT = 6;

interface TopCourseRowProps {
  item: TopCourse;
  rank: number;
  /** Revenue of the best course (the bar shows this row's share of it) */
  maxRevenue: number;
}

/** One top course: rank, cover, title, revenue (with a bar relative to the best) and student counts. */
export const TopCourseRow: FC<TopCourseRowProps> = ({ item, rank, maxRevenue }) => {
  const { t } = useTranslation();
  const { course } = item;
  const share = maxRevenue > 0 ? (item.revenue / maxRevenue) * PERCENT : 0;
  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        borderTop: rank === 1 ? 0 : 1,
        borderColor: 'divider',
      }}
    >
      <Typography sx={{ fontWeight: 800, width: 20, flexShrink: 0 }} color="text.secondary">
        {rank}
      </Typography>
      <CourseThumb coverImage={course?.coverImage} width={COVER_WIDTH} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
          {course?.title ?? t('insights.dashboard.deletedCourse')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('insights.dashboard.topCourseStudents', {
            count: item.enrollments,
            paid: item.paidEnrollments,
          })}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={share}
          aria-hidden
          sx={{
            mt: 0.75,
            height: BAR_HEIGHT,
            borderRadius: 1,
            bgcolor: 'grey.100',
            '& .MuiLinearProgress-bar': { bgcolor: COURSE_REVENUE_COLOR, borderRadius: 1 },
          }}
        />
      </Box>
      <Typography sx={{ fontWeight: 900, flexShrink: 0 }}>{formatMoney(item.revenue)}</Typography>
    </Box>
  );
};
