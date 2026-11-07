'use client';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { formatMonth, recentMonths } from './revenue-period';

import type { FC } from 'react';

interface PeriodFilterProps {
  /** '' all time, 'yyyy-MM' a month, 'custom' a range of days */
  period: string;
  from: string;
  to: string;
  onChange: (changes: { period?: string; from?: string; to?: string }) => void;
}

const ALL_TIME = 'all';
const FIELD_SX = { minWidth: { xs: '100%', sm: 170 } } as const;

/** All time / one of the last 12 months / a custom range (two day pickers). */
export const PeriodFilter: FC<PeriodFilterProps> = ({ period, from, to, onChange }) => {
  const { t, i18n } = useTranslation();
  return (
    <>
      <TextField
        select
        size="small"
        label={t('revenue.period.label')}
        value={period || ALL_TIME}
        onChange={(event) => {
          const value = event.target.value;
          onChange({
            period: value === ALL_TIME ? '' : value,
            ...(value !== 'custom' && { from: '', to: '' }),
          });
        }}
        sx={FIELD_SX}
      >
        <MenuItem value={ALL_TIME}>{t('revenue.period.all')}</MenuItem>
        {recentMonths().map((month) => (
          <MenuItem key={month} value={month}>
            {formatMonth(month, i18n.language)}
          </MenuItem>
        ))}
        <MenuItem value="custom">{t('revenue.period.custom')}</MenuItem>
      </TextField>
      {period === 'custom' && (
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            type="date"
            size="small"
            label={t('revenue.period.from')}
            value={from}
            onChange={(event) => {
              onChange({ from: event.target.value });
            }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || undefined } }}
            sx={{ flex: 1 }}
          />
          <TextField
            type="date"
            size="small"
            label={t('revenue.period.to')}
            value={to}
            onChange={(event) => {
              onChange({ to: event.target.value });
            }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
            sx={{ flex: 1 }}
          />
        </Box>
      )}
    </>
  );
};
