'use client';

import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { DurationClockPicker } from './DurationClockPicker';

import type { TimerForm } from '@/schemas/schedule.schema';
import type { FC } from 'react';
import type { Control } from 'react-hook-form';

interface TimerDurationFieldProps {
  control: Control<TimerForm>;
  /** i18n key of the validation error (duration 0) */
  errorKey?: string;
}

/** "Set Duration" with the clock dial, bound to the timer form. */
export const TimerDurationField: FC<TimerDurationFieldProps> = ({ control, errorKey }) => {
  const { t } = useTranslation();
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
        {t('schedule.timer.setDuration')}
      </Typography>
      <Controller
        control={control}
        name="duration"
        render={({ field }) => (
          <DurationClockPicker value={field.value} onChange={field.onChange} />
        )}
      />
      {errorKey && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t(errorKey)}
        </Alert>
      )}
    </>
  );
};
