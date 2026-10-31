'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { toDateTimeInput } from '@/utils/dateTime';

import type { BulkDiscountState } from './bulk-form';
import type { FC } from 'react';

interface BulkDiscountFormProps {
  form: BulkDiscountState;
  onChange: (key: keyof BulkDiscountState, value: string) => void;
  selectedCount: number;
}

const INPUT_SX = { '& .MuiInputBase-root': { minHeight: 44 } } as const;

/** "Discount Campaign" tab: a percentage off each list price until a future date and time. */
export const BulkDiscountForm: FC<BulkDiscountFormProps> = ({ form, onChange, selectedCount }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
          {t('adminCourses.bulk.discountHeading')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('adminCourses.bulk.discountHelp')}
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField
          size="small"
          type="number"
          label={t('adminCourses.bulk.discountPercent')}
          value={form.discountPercent}
          onChange={(event) => {
            onChange('discountPercent', event.target.value);
          }}
          helperText={t('adminCourses.bulk.discountPercentHelp')}
          slotProps={{
            htmlInput: { min: 1, max: 99, inputMode: 'numeric' },
            input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
          }}
          sx={INPUT_SX}
        />
        <TextField
          size="small"
          type="datetime-local"
          label={t('adminCourses.bulk.discountEndsAt')}
          value={form.discountEndsAt}
          onChange={(event) => {
            onChange('discountEndsAt', event.target.value);
          }}
          helperText={t('adminCourses.bulk.discountEndsAtHelp')}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: toDateTimeInput(new Date()) },
          }}
          sx={INPUT_SX}
        />
      </Box>
      <Alert severity="success" icon={false}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {form.discountPercent
            ? t('adminCourses.bulk.discountSummary', {
                count: selectedCount,
                percent: form.discountPercent,
              })
            : t('adminCourses.bulk.discountReady', { count: selectedCount })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('adminCourses.bulk.discountExample')}
        </Typography>
      </Alert>
    </Box>
  );
};
