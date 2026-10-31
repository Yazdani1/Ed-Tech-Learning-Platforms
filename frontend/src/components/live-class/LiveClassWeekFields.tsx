'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { RichTextField } from '@/components/common/rich-text/RichTextField';
import { useFieldError } from '@/hooks/useFieldError';

import type { LiveClassRequest } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface LiveClassWeekFieldsProps {
  form: UseFormReturn<LiveClassRequest>;
}

const EDITOR_MIN_HEIGHT = 100;

/** Title, week name and the rich text description of a live class week. */
export const LiveClassWeekFields: FC<LiveClassWeekFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { register, control, formState } = form;
  return (
    <>
      <Grid container spacing={1.5} sx={{ pt: 1 }}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...register('title')}
            label={t('catalog.liveClass.weekTitle')}
            required
            fullWidth
            {...fieldError(formState.errors.title)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 7 }}>
          <TextField
            {...register('weekName')}
            label={t('catalog.liveClass.weekName')}
            placeholder={t('catalog.liveClass.weekNamePlaceholder')}
            required
            fullWidth
            {...fieldError(formState.errors.weekName)}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <RichTextField
          control={control}
          name="description"
          label={t('catalog.liveClass.description')}
          placeholder={t('catalog.liveClass.descriptionPlaceholder')}
          minHeight={EDITOR_MIN_HEIGHT}
          showLabel={false}
        />
      </Box>
    </>
  );
};
