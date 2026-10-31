'use client';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import { discountPercent } from '../course-form-data';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface PriceFieldsProps {
  form: UseFormReturn<CourseDetailsForm>;
}

const PRICE_INPUT = { htmlInput: { inputMode: 'decimal' as const } };

/** Paid courses: list price, discount price (the buying price) and the discount percentage. */
export const PriceFields: FC<PriceFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { register, watch, formState } = form;
  const [listPrice, discountPrice] = watch(['listPrice', 'discountPrice']);
  const percent = discountPercent(listPrice, discountPrice);
  const discountHelp =
    percent > 0 ? t('catalog.basic.discountHelp', { percent }) : t('catalog.basic.finalPrice');

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
      <TextField
        {...register('listPrice')}
        label={t('catalog.basic.listPrice')}
        required
        fullWidth
        slotProps={PRICE_INPUT}
        {...fieldError(formState.errors.listPrice)}
      />
      <TextField
        {...register('discountPrice')}
        label={t('catalog.basic.discountPrice')}
        fullWidth
        slotProps={PRICE_INPUT}
        {...(formState.errors.discountPrice
          ? fieldError(formState.errors.discountPrice)
          : { helperText: discountHelp })}
      />
      {percent > 0 && (
        <Chip
          label={t('common.percentOff', { percent })}
          color="success"
          sx={{ fontWeight: 900, mt: { sm: 1 } }}
        />
      )}
    </Stack>
  );
};
