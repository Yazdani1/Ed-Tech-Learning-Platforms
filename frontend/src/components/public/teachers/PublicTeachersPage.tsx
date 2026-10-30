'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useTeachers } from '@/api/public.api';
import { QueryState } from '@/components/common/QueryState';

import { TeacherProfileCard } from './TeacherProfileCard';

/** /teachers: every public teacher profile in a responsive grid. */
export const PublicTeachersPage = () => {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useTeachers();
  const teachers = data ?? [];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
      <Box sx={{ mb: 4, maxWidth: 680 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 900, fontSize: { xs: '2.1rem', md: '3rem' } }}
        >
          {t('public.instructors.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
          {t('public.instructors.pageSubtitle')}
        </Typography>
      </Box>
      <QueryState
        isLoading={isPending}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={teachers.length === 0}
        emptyText={t('public.instructors.empty')}
      >
        <Grid container spacing={3}>
          {teachers.map((teacher) => (
            <Grid key={teacher._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <TeacherProfileCard teacher={teacher} />
            </Grid>
          ))}
        </Grid>
      </QueryState>
    </Container>
  );
};
