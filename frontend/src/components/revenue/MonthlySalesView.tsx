'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { useRevenueMonths } from '@/api/revenue.api';
import { QueryState } from '@/components/common/QueryState';

import { MonthSalesCard } from './MonthSalesCard';

import type { FC } from 'react';

interface MonthlySalesViewProps {
  onOpen: (month: string) => void;
}

const SKELETON_CARDS = 6;
const CARD_HEIGHT = 148;
export const MONTH_GRID_SX = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
} as const;

/** One card per month (latest first): sales, VAT and enrolments; a card opens that month's sales. */
export const MonthlySalesView: FC<MonthlySalesViewProps> = ({ onOpen }) => {
  const { t } = useTranslation();
  const months = useRevenueMonths();
  if (months.isPending) {
    return (
      <Box sx={MONTH_GRID_SX} aria-busy="true" aria-label={t('common.loading')}>
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={CARD_HEIGHT} />
        ))}
      </Box>
    );
  }
  return (
    <QueryState isLoading={false} error={months.error} onRetry={() => void months.refetch()}>
      <Box component="section" aria-label={t('revenue.monthly.label')} sx={MONTH_GRID_SX}>
        {(months.data ?? []).map((month, index) => (
          <MonthSalesCard
            key={month.month}
            month={month}
            latest={index === 0}
            onOpen={() => {
              onOpen(month.month);
            }}
          />
        ))}
      </Box>
    </QueryState>
  );
};
