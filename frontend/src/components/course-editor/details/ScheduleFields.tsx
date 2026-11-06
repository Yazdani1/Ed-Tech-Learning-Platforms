'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface ScheduleFieldsProps {
  form: UseFormReturn<CourseDetailsForm>;
}

const SCHEDULE_ROWS = 2;
const FIELDS = [
  { name: 'liveClassSchedule', label: 'catalog.basic.liveClassSchedule' },
  { name: 'supportClassSchedule', label: 'catalog.basic.supportClassSchedule' },
] as const;

/** Live class and support class schedules: plain text (no date or time picker), both optional. */
export const ScheduleFields: FC<ScheduleFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { register, formState } = form;
  return (
    <Stack spacing={3}>
      {FIELDS.map((field) => {
        const error = formState.errors[field.name];
        return (
          <TextField
            key={field.name}
            {...register(field.name)}
            label={t(field.label)}
            placeholder={t('catalog.basic.schedulePlaceholder')}
            fullWidth
            multiline
            minRows={SCHEDULE_ROWS}
            {...(error ? fieldError(error) : { helperText: t('common.optional') })}
          />
        );
      })}
    </Stack>
  );
};
