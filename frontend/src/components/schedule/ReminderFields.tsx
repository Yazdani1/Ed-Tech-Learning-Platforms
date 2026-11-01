'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';
import { toDateTimeInput } from '@/utils/dateTime';

import type { ReminderForm } from '@/schemas/schedule.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface ReminderFieldsProps {
  form: UseFormReturn<ReminderForm>;
  /** Show the example placeholders (create form) */
  withPlaceholders?: boolean;
}

const ONE_MINUTE_MS = 60_000;

/** Title, description, start and optional end (datetime inputs in the viewer's own time zone). */
export const ReminderFields: FC<ReminderFieldsProps> = ({ form, withPlaceholders = false }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { errors } = form.formState;
  // Fixed when the form opens (a hint for the picker only; the schema checks the real rule)
  const [minStart] = useState(() => toDateTimeInput(new Date(Date.now() + ONE_MINUTE_MS)));
  const start = useWatch({ control: form.control, name: 'startDateTime' });

  return (
    <Stack spacing={2}>
      <TextField
        {...form.register('title')}
        label={t('schedule.form.titleLabel')}
        placeholder={withPlaceholders ? t('schedule.reminder.titlePlaceholder') : undefined}
        required
        fullWidth
        {...fieldError(errors.title)}
      />
      <TextField
        {...form.register('description')}
        label={t('schedule.form.descriptionLabel')}
        placeholder={withPlaceholders ? t('schedule.reminder.descriptionPlaceholder') : undefined}
        fullWidth
        multiline
        rows={2}
      />
      <TextField
        {...form.register('startDateTime')}
        label={t('schedule.reminder.start')}
        type="datetime-local"
        required
        fullWidth
        slotProps={{ htmlInput: { min: minStart }, inputLabel: { shrink: true } }}
        {...fieldError(errors.startDateTime)}
      />
      <TextField
        {...form.register('endDateTime')}
        label={t('schedule.reminder.end')}
        type="datetime-local"
        fullWidth
        slotProps={{ htmlInput: { min: start || minStart }, inputLabel: { shrink: true } }}
        {...fieldError(errors.endDateTime)}
      />
    </Stack>
  );
};
