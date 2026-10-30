'use client';

import CardMembershipIcon from '@mui/icons-material/CardMembership';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import type { Subscription } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PricingHeroProps {
  /** The signed-in Student's running subscription, if any */
  subscription: Subscription | null;
}

/** Dark header of /pricing; a Student with a running plan sees which one and when it expires. */
export const PricingHero: FC<PricingHeroProps> = ({ subscription }) => {
  const { t, i18n } = useTranslation();
  return (
    <Box
      sx={{ bgcolor: '#1c1d1f', color: 'common.white', py: { xs: 6, md: 9 }, textAlign: 'center' }}
    >
      <Container maxWidth="md">
        <CardMembershipIcon aria-hidden sx={{ fontSize: 48, color: '#a78bfa', mb: 2 }} />
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '2rem', md: '2.75rem' } }}
        >
          {t('public.pricing.title')}
        </Typography>
        <Typography
          variant="h6"
          component="p"
          sx={{ fontWeight: 400, opacity: 0.8, maxWidth: 560, mx: 'auto' }}
        >
          {t('public.pricing.subtitle')}
        </Typography>
        {subscription && (
          <Chip
            label={t('public.pricing.currentPlan', {
              plan: subscription.plan,
              date: formatDate(subscription.endDate, i18n.language),
            })}
            sx={{
              mt: 3,
              bgcolor: '#7c3aed',
              color: 'common.white',
              fontWeight: 600,
              maxWidth: '100%',
            }}
          />
        )}
      </Container>
    </Box>
  );
};
