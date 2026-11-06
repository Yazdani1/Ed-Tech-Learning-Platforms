'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CHART_HEIGHT } from '@/components/insights/insights.utils';

import type { RevenueRange } from './RevenueChart';
import type { RevenueSummary } from '@/schemas/revenue.schema';
import type { FC } from 'react';

const RevenueChart = dynamic(() => import('./RevenueChart'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={CHART_HEIGHT} />,
});

interface RevenueChartCardProps {
  summary: RevenueSummary;
}

const RANGES: readonly RevenueRange[] = ['daily', 'weekly', 'monthly'];
const TOUCH_TARGET = 44;
const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 1.5,
  mb: 2,
} as const;

/** The sales chart with its Daily / Weekly / Monthly switch (recharts loaded on demand). */
export const RevenueChartCard: FC<RevenueChartCardProps> = ({ summary }) => {
  const { t } = useTranslation();
  const [range, setRange] = useState<RevenueRange>('daily');
  return (
    <Paper component="figure" variant="outlined" sx={{ p: 2.5, m: 0, mb: 3, minWidth: 0 }}>
      <Box sx={HEADER_SX}>
        <Typography component="figcaption" sx={{ fontWeight: 700 }}>
          {t(`revenue.chart.title.${range}`)}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={range}
          aria-label={t('revenue.chart.range')}
          onChange={(_event, next: RevenueRange | null) => {
            if (next) setRange(next);
          }}
        >
          {RANGES.map((item) => (
            <ToggleButton
              key={item}
              value={item}
              sx={{ minHeight: TOUCH_TARGET, px: 2, textTransform: 'none' }}
            >
              {t(`revenue.chart.ranges.${item}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <RevenueChart data={summary[range]} range={range} />
    </Paper>
  );
};
