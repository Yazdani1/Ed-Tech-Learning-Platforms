'use client';

import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import { todayInput } from './plan-utils';

import type { AssignForm } from '@/schemas/people.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface AssignEndDateFieldProps {
  form: UseFormReturn<AssignForm>;
}

/** End date of an assigned subscription (today or later; it runs to the end of that day). */
export const AssignEndDateField: FC<AssignEndDateFieldProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  return (
    <TextField
      {...form.register('endDate')}
      label={t('people.subscriptions.endDate')}
      type="date"
      required
      slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayInput() } }}
      {...fieldError(form.formState.errors.endDate)}
    />
  );
};
