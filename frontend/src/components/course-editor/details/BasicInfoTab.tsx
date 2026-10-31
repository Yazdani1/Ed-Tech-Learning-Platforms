'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useCategories, useCourseTypes } from '@/api/catalog.api';
import { useFieldError } from '@/hooks/useFieldError';

import { CourseAccessFields } from './CourseAccessFields';
import { FormSelect } from './FormSelect';
import { TeachersField } from './TeachersField';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface BasicInfoTabProps {
  form: UseFormReturn<CourseDetailsForm>;
}

const FORM_MAX_WIDTH = 720;

/** Title, subtitle, category, course type, dates, teachers, visibility, pricing and subscription. */
export const BasicInfoTab: FC<BasicInfoTabProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const categories = useCategories();
  const courseTypes = useCourseTypes();
  const { register, control, watch, formState } = form;
  const startDate = watch('startDate');
  const noCourseTypes = courseTypes.isSuccess && courseTypes.data.length === 0;

  return (
    <Stack spacing={3} sx={{ maxWidth: FORM_MAX_WIDTH }}>
      <TextField
        {...register('title')}
        label={t('catalog.basic.title')}
        required
        fullWidth
        {...fieldError(formState.errors.title)}
      />
      <TextField {...register('subtitle')} label={t('catalog.basic.subtitle')} fullWidth />
      <FormSelect
        control={control}
        name="category"
        label={t('catalog.basic.category')}
        required
        options={(categories.data ?? []).map((item) => ({ value: item._id, label: item.name }))}
      />
      <FormSelect
        control={control}
        name="courseType"
        label={t('catalog.basic.courseType')}
        required
        options={(courseTypes.data ?? []).map((item) => ({ value: item._id, label: item.name }))}
        helperText={noCourseTypes ? t('catalog.basic.noCourseTypes') : undefined}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          {...register('startDate')}
          label={t('catalog.basic.startDate')}
          type="date"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          helperText={t('common.optional')}
        />
        <TextField
          {...register('endDate')}
          label={t('catalog.basic.endDate')}
          type="date"
          fullWidth
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: startDate || undefined } }}
          {...(formState.errors.endDate
            ? fieldError(formState.errors.endDate)
            : { helperText: t('common.optional') })}
        />
      </Stack>
      <TeachersField control={control} />
      <CourseAccessFields form={form} />
    </Stack>
  );
};
