'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { isCourseId, isNotFoundError, useCourse } from '@/api/browse.api';
import { CourseNotFound } from '@/components/browse/detail/CourseNotFound';

import { CoursePaymentContent } from './CoursePaymentContent';

import type { FC } from 'react';

interface CoursePaymentViewProps {
  courseId: string;
}

/** /courses/[id]/payment: loading skeleton, "Course not found", error, or the payment details. */
export const CoursePaymentView: FC<CoursePaymentViewProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const course = useCourse(courseId);

  if (!isCourseId(courseId)) return <CourseNotFound />;
  if (course.isPending) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }} aria-busy="true" aria-label={t('common.loading')}>
        <Skeleton variant="text" sx={{ fontSize: '3rem', width: '50%', mb: 2 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="rounded" height={280} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton variant="rounded" height={480} />
          </Grid>
        </Grid>
      </Container>
    );
  }
  if (course.isError) {
    if (isNotFoundError(course.error)) return <CourseNotFound />;
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void course.refetch()}
              sx={{ minHeight: 44 }}
            >
              {t('common.retry')}
            </Button>
          }
        >
          {course.error.message}
        </Alert>
      </Container>
    );
  }
  return <CoursePaymentContent course={course.data} />;
};
