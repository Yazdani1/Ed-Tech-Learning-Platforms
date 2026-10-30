'use client';

import SchoolIcon from '@mui/icons-material/School';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseGridSkeleton } from '../card/CourseGridSkeleton';

import { FreeCourseGroupSection } from './FreeCourseGroupSection';

import type { FreeCourseGroup } from './group-free-courses';
import type { FC } from 'react';

interface FreeCoursesBodyProps {
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  groups: readonly FreeCourseGroup[];
  enrolledIds: readonly string[];
}

const SKELETON_CARDS = 6;

/** Loading cards, error with retry, "no free courses", or one section per course type. */
export const FreeCoursesBody: FC<FreeCoursesBodyProps> = ({
  isLoading,
  error,
  onRetry,
  groups,
  enrolledIds,
}) => {
  const { t } = useTranslation();
  if (isLoading)
    return <CourseGridSkeleton count={SKELETON_CARDS} size={{ xs: 12, sm: 6, md: 4 }} />;
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      >
        {error.message}
      </Alert>
    );
  }
  if (groups.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} aria-hidden />
        <Typography variant="h6" component="p" color="text.secondary">
          {t('browse.free.empty')}
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {groups.map((group, index) => (
        <Box key={group.id}>
          {index > 0 && <Divider sx={{ mb: 4 }} />}
          <FreeCourseGroupSection group={group} enrolledIds={enrolledIds} />
        </Box>
      ))}
    </Box>
  );
};
