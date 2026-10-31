'use client';

import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { FormSelect } from './FormSelect';
import { PriceFields } from './PriceFields';
import { SubscriptionField } from './SubscriptionField';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface CourseAccessFieldsProps {
  form: UseFormReturn<CourseDetailsForm>;
}

/** Visibility, Free/Paid with list and discount price (BDT), and subscription inclusion. */
export const CourseAccessFields: FC<CourseAccessFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control, watch } = form;
  const pricing = watch('pricing');

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormSelect
          control={control}
          name="visibility"
          label={t('catalog.basic.visibility')}
          options={[
            { value: 'Public', label: t('catalog.basic.public') },
            { value: 'Private', label: t('catalog.basic.private') },
          ]}
        />
        <FormSelect
          control={control}
          name="pricing"
          label={t('catalog.basic.pricing')}
          options={[
            { value: 'Free', label: t('catalog.basic.free') },
            { value: 'Paid', label: t('catalog.basic.paid') },
          ]}
        />
      </Stack>
      {pricing === 'Paid' && <PriceFields form={form} />}
      <SubscriptionField control={control} />
    </>
  );
};
