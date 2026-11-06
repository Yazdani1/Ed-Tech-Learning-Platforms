'use client';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { CouponForm } from '@/schemas/coupon.schema';
import type { FC } from 'react';

interface UsageLimitFieldsProps {
  form: UseFormReturn<CouponForm>;
}

/** "Unlimited uses" switch; when off, how many students may use the code. */
export const UsageLimitFields: FC<UsageLimitFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { control, register, formState } = form;
  const unlimited = useWatch({ control, name: 'unlimited' });
  return (
    <>
      <Controller
        control={control}
        name="unlimited"
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(event) => {
                  field.onChange(event.target.checked);
                }}
              />
            }
            label={t('coupons.unlimited')}
          />
        )}
      />
      {!unlimited && (
        <TextField
          {...register('usageLimit')}
          label={t('coupons.usageLimit')}
          fullWidth
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          {...(formState.errors.usageLimit
            ? fieldError(formState.errors.usageLimit)
            : { helperText: t('coupons.usageLimitHelp') })}
        />
      )}
    </>
  );
};
