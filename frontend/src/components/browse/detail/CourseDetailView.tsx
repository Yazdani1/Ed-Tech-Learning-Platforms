'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useTranslation } from 'react-i18next';

import { isCourseId, isNotFoundError, useCourse } from '@/api/browse.api';

import { CourseDetailContent } from './CourseDetailContent';
import { CourseDetailSkeleton } from './CourseDetailSkeleton';
import { CourseNotFound } from './CourseNotFound';

import type { FC } from 'react';

interface CourseDetailViewProps {
  courseId: string;
}

/** /courses/[id]: loading skeleton, "Course not found" (missing, draft or private), error, or the course page. */
export const CourseDetailView: FC<CourseDetailViewProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const course = useCourse(courseId);

  if (!isCourseId(courseId)) return <CourseNotFound />;
  if (course.isPending) return <CourseDetailSkeleton />;
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
  return <CourseDetailContent course={course.data} />;
};
