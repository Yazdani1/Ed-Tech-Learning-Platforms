'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { CouponCodeField } from './fields/CouponCodeField';
import { DateRangeFields } from './fields/DateRangeFields';
import { DiscountValueFields } from './fields/DiscountValueFields';
import { UsageLimitFields } from './fields/UsageLimitFields';
import { useCouponForm } from './useCouponForm';

import type { CourseCoupon } from '@/schemas/coupon.schema';
import type { FC } from 'react';

interface CouponFormModalProps {
  courseId: string;
  open: boolean;
  /** The coupon being edited; undefined for a new one */
  coupon: CourseCoupon | undefined;
  onClose: () => void;
}

/** Add or edit a course coupon: code (a free one is suggested), percent or amount, use limit, start and end. */
export const CouponFormModal: FC<CouponFormModalProps> = ({ courseId, open, coupon, onClose }) => {
  const { t } = useTranslation();
  const { form, submit, saving, error } = useCouponForm(courseId, open, coupon, onClose);
  const { register, control, setValue, formState } = form;
  const { errors } = formState;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(coupon ? 'coupons.edit' : 'coupons.add')}
      onSave={submit}
      saveLabel={coupon ? t('common.update') : t('common.save')}
      saving={saving}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {error && <Alert severity="error">{error.message}</Alert>}
        <CouponCodeField
          registration={register('code')}
          label={t('coupons.code')}
          required
          error={Boolean(errors.code)}
          helperText={errors.code?.message ? t(errors.code.message) : t('coupons.codeHelp')}
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
        <UsageLimitFields form={form} />
        <DateRangeFields
          start={register('startsAt')}
          end={register('endsAt')}
          endError={errors.endsAt}
        />
      </Stack>
    </AppModal>
  );
};
