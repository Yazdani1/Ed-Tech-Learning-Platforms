'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { DiscountCouponFields } from './DiscountCouponFields';
import { FormSelect } from './FormSelect';
import { PriceFields } from './PriceFields';
import { SubscriptionField } from './SubscriptionField';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface PricingTabProps {
  form: UseFormReturn<CourseDetailsForm>;
}

const FORM_MAX_WIDTH = 720;

/**
 * Free or Paid; a paid course's list price and discount price. The discount is the course's auto coupon:
 * its code is pre-filled on the course and payment pages between its start and end.
 */
export const PricingTab: FC<PricingTabProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control, watch } = form;
  const [pricing, listPrice, discountPrice] = watch(['pricing', 'listPrice', 'discountPrice']);
  const hasDiscount =
    pricing === 'Paid' && discountPrice !== '' && Number(discountPrice) < Number(listPrice);

  return (
    <Stack spacing={3} sx={{ maxWidth: FORM_MAX_WIDTH }}>
      <FormSelect
        control={control}
        name="pricing"
        label={t('catalog.basic.pricing')}
        options={[
          { value: 'Free', label: t('catalog.basic.free') },
          { value: 'Paid', label: t('catalog.basic.paid') },
        ]}
      />
      {pricing === 'Paid' && <PriceFields form={form} />}
      {hasDiscount && <DiscountCouponFields form={form} />}
      {pricing === 'Paid' && !hasDiscount && (
        <Alert severity="info">{t('catalog.pricing.noDiscountHelp')}</Alert>
      )}
      <SubscriptionField control={control} />
    </Stack>
  );
};
