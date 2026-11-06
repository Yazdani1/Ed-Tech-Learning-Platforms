'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useActivePromoCourses, useActivePromos } from '@/api/promos.api';
import { CourseGrid } from '@/components/public/common/CourseGrid';
import { DISPLAY_FONT } from '@/theme/fonts';

import { promoDiscountLabel } from './promo-format';

const SKELETONS = 6;

/** /promo: the running promo's courses as course cards (each opens its course page). */
export const PromoCoursesPage = () => {
  const { t } = useTranslation();
  const promos = useActivePromos();
  const courses = useActivePromoCourses();
  const promo = promos.data?.[0];
  const noPromo = promos.isSuccess && !promo;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 800,
            fontSize: { xs: '1.9rem', md: '2.6rem' },
          }}
        >
          {promo ? promo.title : t('promos.page.title')}
        </Typography>
        {promo && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t('promos.page.subtitle', {
              discount: promoDiscountLabel(t, promo),
              code: promo.code,
            })}
          </Typography>
        )}
      </Box>
      {noPromo ? (
        <Alert severity="info">{t('promos.page.none')}</Alert>
      ) : courses.error ? (
        <Alert severity="error">{courses.error.message}</Alert>
      ) : (
        <CourseGrid courses={courses.data} isLoading={courses.isPending} skeletons={SKELETONS} />
      )}
    </Container>
  );
};
