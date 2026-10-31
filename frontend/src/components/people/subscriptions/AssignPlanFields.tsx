'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';
import { formatBdt } from '@/utils/price';

import { firstBillingDuration, getBillingOptions } from './plan-utils';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { AssignForm } from '@/schemas/people.schema';
import type { FC } from 'react';

interface AssignPlanFieldsProps {
  form: UseFormReturn<AssignForm>;
  plans: SubscriptionPlan[];
}

/** Plan and billing option selects (changing the plan picks its first one). */
export const AssignPlanFields: FC<AssignPlanFieldsProps> = ({ form, plans }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const planName = useWatch({ control: form.control, name: 'plan' });
  const selected = plans.find((plan) => plan.plan === planName);
  const { errors } = form.formState;

  return (
    <>
      <Controller
        control={form.control}
        name="plan"
        render={({ field }) => (
          <TextField
            select
            label={t('people.subscriptions.plan')}
            required
            value={field.value}
            onChange={(event) => {
              field.onChange(event.target.value);
              const next = plans.find((plan) => plan.plan === event.target.value);
              form.setValue('billingDuration', firstBillingDuration(next));
            }}
            {...fieldError(errors.plan)}
          >
            {plans.map((plan) => (
              <MenuItem key={plan._id} value={plan.plan} sx={{ minHeight: 44 }}>
                {plan.plan}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={form.control}
        name="billingDuration"
        render={({ field }) => (
          <TextField
            select
            label={t('people.subscriptions.billingOption')}
            required
            value={field.value}
            onChange={field.onChange}
            {...fieldError(errors.billingDuration)}
          >
            {(selected ? getBillingOptions(selected) : []).map((option) => (
              <MenuItem
                key={option.duration}
                value={String(option.duration)}
                sx={{ minHeight: 44 }}
              >
                {option.label || t('people.plans.months', { count: option.duration })} -{' '}
                {formatBdt(option.price)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </>
  );
};
