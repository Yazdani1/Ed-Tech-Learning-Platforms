'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { ChartCard } from '@/components/insights/ChartCard';
import { CHART_HEIGHT, formatMoney } from '@/components/insights/insights.utils';

import type { RevenueBreakdown } from '@/schemas/revenue.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

const BreakdownPieChart = dynamic(
  () => import('@/components/insights/BreakdownPieChart').then((mod) => mod.BreakdownPieChart),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={CHART_HEIGHT} /> },
);

interface TopCoursesPieProps {
  breakdown: UseQueryResult<RevenueBreakdown, ApiError>;
}

const DONUT = '55%';

/** The 5 courses that earned the most in the period, as a donut (sales per course). */
export const TopCoursesPie: FC<TopCoursesPieProps> = ({ breakdown }) => {
  const { t } = useTranslation();
  const top = breakdown.data?.topCourses ?? [];
  return (
    <Box sx={{ mb: 2.5 }}>
      <ChartCard title={t('revenue.topCourses')}>
        {breakdown.isPending && <Skeleton variant="rounded" height={CHART_HEIGHT} />}
        {!breakdown.isPending && top.length === 0 && (
          <Typography color="text.secondary" sx={{ pt: 4, textAlign: 'center' }}>
            {t('revenue.noPaidSales')}
          </Typography>
        )}
        {top.length > 0 && (
          <BreakdownPieChart
            data={top.map((course) => ({
              label: course.batchNumber ? `${course.title} (${course.batchNumber})` : course.title,
              value: course.revenue,
            }))}
            innerRadius={DONUT}
            formatValue={formatMoney}
          />
        )}
      </ChartCard>
    </Box>
  );
};
