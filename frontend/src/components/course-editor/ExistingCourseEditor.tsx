'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { isCourseId, isNotFoundError, useCourse } from '@/api/browse.api';
import { QueryState } from '@/components/common/QueryState';

import { CourseEditorScreen } from './CourseEditorScreen';

import type { FC } from 'react';

interface ExistingCourseEditorProps {
  courseId: string;
}

/** Loads the course, then shows the editor (or "Course not found"). */
export const ExistingCourseEditor: FC<ExistingCourseEditorProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const query = useCourse(courseId);
  const notFound = !isCourseId(courseId) || isNotFoundError(query.error);

  if (notFound) {
    return (
      <Alert
        severity="warning"
        action={
          <Button component={Link} href="/admin/courses" color="inherit" sx={{ minHeight: 44 }}>
            {t('catalog.editor.back')}
          </Button>
        }
      >
        {t('catalog.editor.notFound')}
      </Alert>
    );
  }
  return (
    <QueryState
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      skeletonRows={6}
    >
      {query.data && <CourseEditorScreen key={query.data._id} course={query.data} />}
    </QueryState>
  );
};
