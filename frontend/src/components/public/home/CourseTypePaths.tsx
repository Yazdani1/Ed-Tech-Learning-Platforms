'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { useCourseTypes } from '@/api/catalog.api';
import { QueryState } from '@/components/common/QueryState';

import { CourseTypeCard } from './CourseTypeCard';
import { SectionHeading } from './SectionHeading';

/** "Learn what matches your ambition": one card per course type. Left out when there are none. */
export const CourseTypePaths = () => {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useCourseTypes();
  const courseTypes = data ?? [];

  if (!isPending && !error && courseTypes.length === 0) return null;

  return (
    <Box component="section" sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
        <SectionHeading title={t('public.paths.title')} subtitle={t('public.paths.subtitle')} />
        <QueryState
          isLoading={isPending}
          error={error}
          onRetry={() => void refetch()}
          skeletonRows={2}
        >
          <Grid container spacing={2.5}>
            {courseTypes.map((courseType, index) => (
              <Grid key={courseType._id} size={{ xs: 12, sm: 6, md: 3 }}>
                <CourseTypeCard courseType={courseType} index={index} />
              </Grid>
            ))}
          </Grid>
        </QueryState>
      </Container>
    </Box>
  );
};
