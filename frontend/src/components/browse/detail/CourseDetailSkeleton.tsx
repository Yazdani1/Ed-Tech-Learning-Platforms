'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

/** Placeholder of the course page while it loads. */
export const CourseDetailSkeleton = () => {
  const { t } = useTranslation();
  return (
    <Box aria-busy="true" aria-label={t('common.loading')}>
      <Box sx={{ bgcolor: '#1c1d1f', py: { xs: 4, md: 7 } }}>
        <Container maxWidth="lg">
          <Skeleton variant="text" sx={{ bgcolor: 'grey.800', width: '40%' }} />
          <Skeleton variant="text" sx={{ bgcolor: 'grey.800', fontSize: '2rem', width: '75%' }} />
          <Skeleton variant="text" sx={{ bgcolor: 'grey.800', width: '55%' }} />
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={140} />
              <Skeleton variant="rounded" height={200} />
              <Skeleton variant="rounded" height={260} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={420} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
