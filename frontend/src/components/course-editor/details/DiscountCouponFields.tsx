'use client';

import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CouponCodeField } from '@/components/coupons/fields/CouponCodeField';
import { DateRangeFields } from '@/components/coupons/fields/DateRangeFields';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface DiscountCouponFieldsProps {
  form: UseFormReturn<CourseDetailsForm>;
}

/** The discount's coupon: code (suggested when empty), start and end (empty = from now / no end). */
export const DiscountCouponFields: FC<DiscountCouponFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const { register, setValue, formState } = form;
  const codeError = formState.errors.discountCode;
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, bgcolor: '#f8fafc' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LocalOfferOutlinedIcon color="primary" aria-hidden />
        <Typography component="h3" sx={{ fontWeight: 700 }}>
          {t('catalog.pricing.couponTitle')}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('catalog.pricing.couponHelp')}
      </Typography>
      <Stack spacing={2}>
        <CouponCodeField
          registration={register('discountCode')}
          label={t('catalog.pricing.couponCode')}
          error={Boolean(codeError)}
          helperText={
            codeError?.message ? t(codeError.message) : t('catalog.pricing.couponCodeHelp')
          }
          onSuggest={(code) => {
            setValue('discountCode', code, { shouldDirty: true, shouldValidate: true });
          }}
        />
        <DateRangeFields
          start={register('discountStartsAt')}
          end={register('discountEndsAt')}
          endError={formState.errors.discountEndsAt}
        />
      </Stack>
    </Paper>
  );
};
