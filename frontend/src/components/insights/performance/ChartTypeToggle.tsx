'use client';

import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import type { ChartType } from './usePerformanceParams';
import type { FC, ReactElement } from 'react';

const TOUCH_TARGET = 44;

const CHART_OPTIONS: { value: ChartType; labelKey: string; icon: ReactElement }[] = [
  { value: 'line', labelKey: 'insights.performance.lineChart', icon: <ShowChartIcon /> },
  { value: 'bar', labelKey: 'insights.performance.barChart', icon: <BarChartIcon /> },
  { value: 'pie', labelKey: 'insights.performance.pieChart', icon: <PieChartIcon /> },
];

interface ChartTypeToggleProps {
  value: ChartType;
  onChange: (value: ChartType) => void;
}

/** Line / bar / pie switch (icon buttons with tooltips and accessible names). */
export const ChartTypeToggle: FC<ChartTypeToggleProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      aria-label={t('insights.performance.chartType')}
      onChange={(_event, next: ChartType | null) => {
        if (next) onChange(next);
      }}
    >
      {CHART_OPTIONS.map((option) => (
        <Tooltip key={option.value} title={t(option.labelKey)}>
          <ToggleButton
            value={option.value}
            aria-label={t(option.labelKey)}
            sx={{ minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET }}
          >
            {option.icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};
