'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { RevenuePeriodCard } from '../RevenuePeriodCard';
import { FOUR_COLUMNS, PERIOD_ICONS } from '../period-icons';
import { PERIOD_COLORS, PERIOD_LABEL_KEYS, formatMoney } from '../insights.utils';

import { REVENUE_PERIODS, type DashboardSummary } from '@/schemas/insights.schema';
import type { FC } from 'react';

interface DashboardRevenueCardsProps {
  revenue: DashboardSummary['revenue'];
}

/** Revenue today, in the last 7 days, this month and all time: one tinted card each. */
export const DashboardRevenueCards: FC<DashboardRevenueCardsProps> = ({ revenue }) => {
  const { t } = useTranslation();
  return (
    <Box
      component="section"
      aria-label={t('insights.dashboard.revenueCards')}
      sx={{ display: 'grid', gap: 2, gridTemplateColumns: FOUR_COLUMNS, mb: 2 }}
    >
      {REVENUE_PERIODS.map((period) => {
        const numbers = revenue[period];
        return (
          <RevenuePeriodCard
            key={period}
            label={t(PERIOD_LABEL_KEYS[period])}
            value={formatMoney(numbers.total)}
            color={PERIOD_COLORS[period]}
            icon={PERIOD_ICONS[period]}
            details={[
              t('insights.dashboard.revenueSplit', {
                course: formatMoney(numbers.course),
                subscription: formatMoney(numbers.subscription),
              }),
              t('insights.dashboard.periodEnrollments', {
                count: numbers.enrollments,
                paid: numbers.paidEnrollments,
              }),
            ]}
          />
        );
      })}
    </Box>
  );
};
