'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { TopCourseRow } from './TopCourseRow';

import type { TopCourse } from '@/schemas/insights.schema';
import type { FC } from 'react';

interface TopCoursesCardProps {
  courses: TopCourse[];
}

/** The five courses with the most enrolments. */
export const TopCoursesCard: FC<TopCoursesCardProps> = ({ courses }) => {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <Paper component="section" variant="outlined" aria-labelledby={titleId}>
      <Typography id={titleId} component="h2" variant="h6" sx={{ fontWeight: 800, p: 2.5 }}>
        {t('insights.dashboard.topCourses')}
      </Typography>
      <Divider />
      {courses.length === 0 ? (
        <Typography sx={{ p: 2.5 }} color="text.secondary">
          {t('insights.dashboard.noEnrollments')}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {courses.map((item, index) => (
            <TopCourseRow
              key={item.course?._id ?? `deleted-${String(index)}`}
              item={item}
              isFirst={index === 0}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
};
