'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { heroVisibilitySchema, type HeroPostForm } from '@/schemas/showcase.schema';

import type { FC } from 'react';

interface HeroPostFormFieldsProps {
  form: UseFormReturn<HeroPostForm>;
}

/** Title, description, visibility, schedule date and position of a slider image. */
export const HeroPostFormFields: FC<HeroPostFormFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const { errors } = form.formState;
  const orderError = errors.order?.message;
  return (
    <>
      <TextField
        {...form.register('title')}
        fullWidth
        label={t('showcase.form.title')}
        error={Boolean(errors.title)}
        helperText={errors.title?.message ? t(errors.title.message) : undefined}
      />
      <TextField
        {...form.register('description')}
        fullWidth
        multiline
        minRows={3}
        label={t('showcase.form.description')}
        error={Boolean(errors.description)}
        helperText={errors.description?.message ? t(errors.description.message) : undefined}
      />
      <Controller
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <TextField {...field} select fullWidth label={t('showcase.form.visibility')}>
            {heroVisibilitySchema.options.map((value) => (
              <MenuItem key={value} value={value} sx={{ minHeight: 44 }}>
                {t(`showcase.visibility.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <TextField
        {...form.register('publishAt')}
        type="datetime-local"
        fullWidth
        label={t('showcase.form.publishAt')}
        slotProps={{ inputLabel: { shrink: true } }}
        helperText={t('showcase.form.publishAtHint')}
      />
      <TextField
        {...form.register('order')}
        type="number"
        fullWidth
        label={t('showcase.form.order')}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        error={Boolean(orderError)}
        helperText={orderError ? t(orderError) : t('showcase.form.orderHint')}
      />
    </>
  );
};
