'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { AboutSkeleton } from './skeleton/AboutSkeleton';
import { EnrollCardSkeleton } from './skeleton/EnrollCardSkeleton';
import { HeroSkeleton } from './skeleton/HeroSkeleton';
import { LearnBandSkeleton } from './skeleton/LearnBandSkeleton';

/**
 * Placeholder of the course page with its real layout: the dark banner, the enrolment card on the right
 * (first on phones, overlapping the banner on wider screens), schedule and "About" on the left, then the grey
 * "What you'll learn" band.
 */
export const CourseDetailSkeleton = () => {
  const { t } = useTranslation();
  return (
    <Box aria-busy="true" aria-label={t('common.loading')}>
      <HeroSkeleton />
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 } }}>
            <AboutSkeleton />
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ order: { xs: 1, md: 2 }, mt: { md: -20 }, zIndex: 1 }}
          >
            <EnrollCardSkeleton />
          </Grid>
        </Grid>
      </Container>
      <LearnBandSkeleton />
    </Box>
  );
};
