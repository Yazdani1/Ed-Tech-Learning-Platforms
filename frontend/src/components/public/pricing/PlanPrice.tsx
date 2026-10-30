'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatAmount } from '@/utils/price';

import { durationLabel, getSavings } from './pricing.utils';

import type { BillingOption } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PlanPriceProps {
  options: BillingOption[];
  selected: BillingOption | undefined;
  /** The period chosen in the toggle (for the "not offered" text) */
  period: number | null;
}

/** "BDT 1,000 for 3 months" plus the saving against paying monthly. */
export const PlanPrice: FC<PlanPriceProps> = ({ options, selected, period }) => {
  const { t } = useTranslation();
  const savings = getSavings(options, selected);
  return (
    <>
      <Typography
        variant="h3"
        component="p"
        sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', md: '3rem' } }}
      >
        {selected
          ? t('public.pricing.price', { amount: formatAmount(selected.price) })
          : t('public.pricing.notAvailable')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {selected
          ? selected.duration === 1
            ? t('public.pricing.forOneMonth')
            : t('public.pricing.forMonths', { count: selected.duration })
          : t('public.pricing.notOffered', {
              period: period ? durationLabel(period, t).toLowerCase() : '',
            })}
      </Typography>
      {savings && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1.25 }}>
          <Chip
            label={t('public.pricing.save', {
              amount: formatAmount(savings.savings),
              percent: savings.percent,
            })}
            size="small"
            color="success"
            sx={{ fontWeight: 800 }}
          />
          <Typography variant="caption" color="text.secondary">
            {t('public.pricing.monthlyEquivalent', {
              amount: formatAmount(savings.monthlyEquivalent),
            })}
          </Typography>
        </Box>
      )}
    </>
  );
};
