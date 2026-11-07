'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';
import { CardGridSkeleton } from '@/components/common/skeletons/CardGridSkeleton';
import { CHART_HEIGHT } from '@/components/insights/insights.utils';
import {
  PERIOD_COLORS,
  PERIOD_LABEL_KEYS,
  formatMoney,
} from '@/components/insights/insights.utils';
import { FOUR_COLUMNS, PERIOD_ICONS } from '@/components/insights/period-icons';
import { RevenuePeriodCard } from '@/components/insights/RevenuePeriodCard';
import { REVENUE_PERIODS } from '@/schemas/insights.schema';

import { RevenueChartCard } from './RevenueChartCard';

import type { RevenueSummary } from '@/schemas/revenue.schema';
import type { ApiError } from '@/services/http.service';
import type { FC } from 'react';

interface RevenueOverviewProps {
  summary: RevenueSummary | undefined;
  isPending: boolean;
  error: ApiError | null;
  onRetry: () => void;
}

const CARD_SKELETON_HEIGHT = 132;
const CHART_SKELETON_HEIGHT = CHART_HEIGHT + 90;

/** Sales today / last 7 days / this month / all time, and the daily, weekly or monthly sales chart. */
export const RevenueOverview: FC<RevenueOverviewProps> = ({
  summary,
  isPending,
  error,
  onRetry,
}) => {
  const { t } = useTranslation();
  return (
    <QueryState
      isLoading={isPending}
      error={error}
      onRetry={onRetry}
      skeleton={
        <Box aria-busy="true" aria-label={t('common.loading')}>
          <CardGridSkeleton count={4} columns={FOUR_COLUMNS} height={CARD_SKELETON_HEIGHT} />
          <CardGridSkeleton count={1} columns="1fr" height={CHART_SKELETON_HEIGHT} mb={3} />
        </Box>
      }
    >
      {summary && (
        <>
          <Box
            component="section"
            aria-label={t('revenue.cards')}
            sx={{ display: 'grid', gap: 2, gridTemplateColumns: FOUR_COLUMNS, mb: 2 }}
          >
            {REVENUE_PERIODS.map((period) => (
              <RevenuePeriodCard
                key={period}
                label={t(PERIOD_LABEL_KEYS[period])}
                value={formatMoney(summary.totals[period].revenue)}
                color={PERIOD_COLORS[period]}
                icon={PERIOD_ICONS[period]}
                details={[
                  t('revenue.periodOrders', {
                    count: summary.totals[period].orders,
                    paid: summary.totals[period].paidOrders,
                  }),
                  t('revenue.periodVat', { amount: formatMoney(summary.totals[period].vat) }),
                ]}
              />
            ))}
          </Box>
          <RevenueChartCard summary={summary} />
        </>
      )}
    </QueryState>
  );
};
