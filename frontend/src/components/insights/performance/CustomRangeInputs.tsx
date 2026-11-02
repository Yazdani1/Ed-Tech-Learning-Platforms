'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { todayDateInput } from '@/utils/dateTime';

import type { FC } from 'react';

const INPUT_SX = { minWidth: 160, flex: { xs: 1, sm: 'none' } } as const;

interface CustomRangeInputsProps {
  from: string;
  to: string;
  onChange: (changes: { from?: string; to?: string }) => void;
}

/** Start and end day of a custom range (native date pickers; the end cannot be before the start). */
export const CustomRangeInputs: FC<CustomRangeInputsProps> = ({ from, to, onChange }) => {
  const { t } = useTranslation();
  const today = todayDateInput();
  const reversed = from !== '' && to !== '' && to < from;
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: { xs: '1 1 100%', md: 'none' } }}>
      <TextField
        type="date"
        size="small"
        label={t('insights.performance.from')}
        value={from}
        onChange={(event) => {
          onChange({ from: event.target.value });
        }}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || today } }}
        sx={INPUT_SX}
      />
      <TextField
        type="date"
        size="small"
        label={t('insights.performance.to')}
        value={to}
        error={reversed}
        helperText={reversed ? t('insights.performance.rangeReversed') : undefined}
        onChange={(event) => {
          onChange({ to: event.target.value });
        }}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { min: from || undefined, max: today },
        }}
        sx={INPUT_SX}
      />
    </Box>
  );
};
