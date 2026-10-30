'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFreeCourses } from '@/api/browse.api';
import { useCourseTypes } from '@/api/catalog.api';
import { useBrowseEnrolledIds } from '@/hooks/useBrowseEnrolledIds';

import { FreeCoursesBody } from './FreeCoursesBody';
import { groupFreeCourses } from './group-free-courses';

const PANEL_SX = {
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  px: { xs: 2, md: 3 },
  py: { xs: 3, md: 4 },
} as const;

/** /free-courses: every free public course, grouped by course type. */
export const FreeCoursesView = () => {
  const { t } = useTranslation();
  const courses = useFreeCourses();
  const types = useCourseTypes();
  const enrolledIds = useBrowseEnrolledIds();
  const isLoading = courses.isPending || types.isPending;
  const groups = useMemo(
    () => groupFreeCourses(courses.data ?? [], types.data ?? []),
    [courses.data, types.data],
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 8 }}>
      <Box sx={PANEL_SX}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
            {t('browse.free.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} aria-live="polite">
            {isLoading
              ? t('browse.free.loading')
              : t('browse.free.available', { count: courses.data?.length ?? 0 })}
          </Typography>
        </Box>
        <FreeCoursesBody
          isLoading={isLoading}
          error={courses.error ?? types.error}
          onRetry={() => {
            void courses.refetch();
            void types.refetch();
          }}
          groups={groups}
          enrolledIds={enrolledIds}
        />
      </Box>
    </Container>
  );
};
