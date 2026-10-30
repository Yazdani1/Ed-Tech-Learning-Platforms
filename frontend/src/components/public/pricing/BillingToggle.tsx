'use client';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTranslation } from 'react-i18next';

import { durationLabel } from './pricing.utils';

import type { FC } from 'react';

interface BillingToggleProps {
  periods: number[];
  value: number | null;
  onChange: (duration: number) => void;
}

/** Monthly / 3 months / Yearly ... switch above the plans (only when plans offer more than one). */
export const BillingToggle: FC<BillingToggleProps> = ({ periods, value, onChange }) => {
  const { t } = useTranslation();
  if (periods.length <= 1) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
      <ToggleButtonGroup
        exclusive
        value={value}
        aria-label={t('public.pricing.billingLabel')}
        onChange={(_, next: number | null) => {
          if (next !== null) onChange(next);
        }}
        sx={{
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 0.75,
          p: 0.75,
          borderRadius: 3,
          bgcolor: '#f8fafc',
          border: '1px solid #dbeafe',
          '& .MuiToggleButtonGroup-grouped': { border: 0, m: 0, borderRadius: 2 },
          '& .MuiToggleButton-root': {
            minWidth: { xs: 92, sm: 116 },
            minHeight: 44,
            fontWeight: 800,
            textTransform: 'none',
            bgcolor: 'background.paper',
            '&.Mui-selected, &.Mui-selected:hover': { color: 'common.white', bgcolor: '#2563eb' },
          },
        }}
      >
        {periods.map((duration) => (
          <ToggleButton key={duration} value={duration}>
            {durationLabel(duration, t)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};
