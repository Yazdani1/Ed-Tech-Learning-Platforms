'use client';

import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {
  Controller,
  type Control,
  type FieldError,
  type FieldValues,
  type Path,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { ReactElement } from 'react';

interface DiscountValueFieldsProps<T extends FieldValues> {
  control: Control<T>;
  typeName: Path<T>;
  valueRegistration: UseFormRegisterReturn;
  valueError: FieldError | undefined;
}

/** Percent or amount, and the discount value, side by side from tablet width. (Generic, so a function.) */
export const DiscountValueFields = <T extends FieldValues>({
  control,
  typeName,
  valueRegistration,
  valueError,
}: DiscountValueFieldsProps<T>): ReactElement => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Controller
        control={control}
        name={typeName}
        render={({ field }) => (
          <TextField {...field} select label={t('coupons.discountType')} fullWidth>
            <MenuItem value="percent">{t('coupons.type.percent')}</MenuItem>
            <MenuItem value="amount">{t('coupons.type.amount')}</MenuItem>
          </TextField>
        )}
      />
      <TextField
        {...valueRegistration}
        label={t('coupons.value')}
        required
        fullWidth
        slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        {...fieldError(valueError)}
      />
    </Stack>
  );
};
