'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useRevenueBreakdown } from '@/api/revenue.api';

import { formatMonth } from './revenue-period';
import { SalesPanel } from './SalesPanel';
import { TopCoursesPie } from './TopCoursesPie';

import type { useRevenueParams } from './useRevenueParams';
import type { FC } from 'react';

interface MonthDetailViewProps {
  month: string;
  revenue: ReturnType<typeof useRevenueParams>;
  onBack: () => void;
}

/** One month: back to the months, the top 5 courses (pie) and every sale of the month with filters and export. */
export const MonthDetailView: FC<MonthDetailViewProps> = ({ month, revenue, onBack }) => {
  const { t, i18n } = useTranslation();
  // The pie shows the whole month (every course and type)
  const wholeMonth = useRevenueBreakdown({
    type: 'all',
    courseIds: [],
    from: revenue.filters.from,
    to: revenue.filters.to,
  });
  const label = formatMonth(month, i18n.language);
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ minHeight: 44 }}>
          {t('revenue.monthly.back')}
        </Button>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
          {label}
        </Typography>
      </Box>
      <TopCoursesPie breakdown={wholeMonth} />
      <SalesPanel revenue={revenue} showPeriod={false} fileName={`sales-${month}`} />
    </Box>
  );
};
