'use client';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { CARD_COVER_HEIGHT } from '@/components/course-card/CourseCover';

import { COURSE_GRID_SIZE } from './EnrolledCourseSection';

import type { FC } from 'react';

const DEFAULT_COUNT = 8;

interface CourseCardSkeletonsProps {
  count?: number;
}

/** Placeholder cards while the course list loads. */
export const CourseCardSkeletons: FC<CourseCardSkeletonsProps> = ({ count = DEFAULT_COUNT }) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={3} aria-busy="true" aria-label={t('common.loading')}>
      {Array.from({ length: count }, (_, index) => (
        <Grid key={index} size={COURSE_GRID_SIZE}>
          <Card variant="outlined">
            <Skeleton variant="rectangular" height={CARD_COVER_HEIGHT} />
            <Skeleton variant="text" sx={{ mx: 1.5, mt: 1 }} />
            <Skeleton variant="text" sx={{ mx: 1.5, width: '60%' }} />
            <Skeleton variant="text" sx={{ mx: 1.5, mb: 1.5, width: '30%' }} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
