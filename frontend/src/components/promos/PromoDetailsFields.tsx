'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { CouponCodeField } from '@/components/coupons/fields/CouponCodeField';
import { DateRangeFields } from '@/components/coupons/fields/DateRangeFields';
import { DiscountValueFields } from '@/components/coupons/fields/DiscountValueFields';
import { useFieldError } from '@/hooks/useFieldError';

import type { PromoForm } from '@/schemas/promo.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface PromoDetailsFieldsProps {
  form: UseFormReturn<PromoForm>;
}

/** Right column of the promo dialog: title, code, percent or amount, start and end. */
export const PromoDetailsFields: FC<PromoDetailsFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { register, control, setValue, formState } = form;
  const { errors } = formState;
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <TextField
        {...register('title')}
        label={t('promos.fields.title')}
        required
        fullWidth
        {...(errors.title
          ? fieldError(errors.title)
          : { helperText: t('promos.fields.titleHelp') })}
      />
      <CouponCodeField
        registration={register('code')}
        label={t('coupons.code')}
        required
        error={Boolean(errors.code)}
        helperText={errors.code?.message ? t(errors.code.message) : undefined}
        onSuggest={(code) => {
          setValue('code', code, { shouldValidate: true });
        }}
      />
      <DiscountValueFields
        control={control}
        typeName="discountType"
        valueRegistration={register('value')}
        valueError={errors.value}
      />
      <DateRangeFields
        start={register('startsAt')}
        end={register('endsAt')}
        startError={errors.startsAt}
        endError={errors.endsAt}
        required
      />
      <Alert severity="info">{t('promos.fields.bannerNote')}</Alert>
    </Stack>
  );
};
