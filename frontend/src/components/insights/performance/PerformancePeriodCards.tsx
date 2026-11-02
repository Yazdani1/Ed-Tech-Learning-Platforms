'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { RevenuePeriodCard } from '../RevenuePeriodCard';
import { FOUR_COLUMNS, PERIOD_ICONS } from '../period-icons';
import { PERIOD_COLORS, PERIOD_LABEL_KEYS, formatMoney } from '../insights.utils';

import { REVENUE_PERIODS } from '@/schemas/insights.schema';
import type { PerformanceOverview } from '@/schemas/insights.schema';
import type { FC } from 'react';

const SKELETON_HEIGHT = 118;
interface PerformancePeriodCardsProps {
  data: PerformanceOverview | undefined;
}

/** Revenue of the selected course(s) today, in the last 7 days, this month and all time. */
export const PerformancePeriodCards: FC<PerformancePeriodCardsProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <Box
      component="section"
      aria-label={t('insights.performance.periodsLabel')}
      sx={{ display: 'grid', gap: 2, gridTemplateColumns: FOUR_COLUMNS, mb: 3 }}
    >
      {REVENUE_PERIODS.map((period) =>
        data ? (
          <RevenuePeriodCard
            key={period}
            label={t(PERIOD_LABEL_KEYS[period])}
            value={formatMoney(data.periods[period].revenue)}
            color={PERIOD_COLORS[period]}
            icon={PERIOD_ICONS[period]}
            details={[
              t('insights.performance.periodLine', {
                count: data.periods[period].enrollments,
                paid: data.periods[period].paidEnrollments,
              }),
            ]}
          />
        ) : (
          <Skeleton key={period} variant="rounded" height={SKELETON_HEIGHT} />
        ),
      )}
    </Box>
  );
};
