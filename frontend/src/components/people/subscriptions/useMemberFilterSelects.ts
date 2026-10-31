'use client';

import { useTranslation } from 'react-i18next';

import { memberStatusSchema } from '@/schemas/people.schema';

import { billingDurations } from './plan-utils';

import type { FilterOption } from '@/components/common/FilterSelect';
import type { SubscriptionPlan } from '@/schemas/catalog.schema';

export type MemberFilterKey = 'search' | 'plan' | 'status' | 'billingDuration';

export interface MemberSelectConfig {
  key: Exclude<MemberFilterKey, 'search'>;
  label: string;
  options: FilterOption[];
  allLabel?: string;
}

/** The plan, status and billing duration selects of the member filters. */
export const useMemberFilterSelects = (plans: SubscriptionPlan[]): MemberSelectConfig[] => {
  const { t } = useTranslation();
  return [
    {
      key: 'plan',
      label: t('people.subscriptions.plan'),
      allLabel: t('people.users.allPlans'),
      options: plans.map((plan) => ({ value: plan.plan, label: plan.plan })),
    },
    {
      key: 'status',
      label: t('common.status'),
      options: memberStatusSchema.options.map((value) => ({
        value,
        label: t(`people.subscriptions.tabs.${value}`),
      })),
    },
    {
      key: 'billingDuration',
      label: t('people.subscriptions.billingDuration'),
      allLabel: t('people.subscriptions.allDurations'),
      options: billingDurations(plans).map((option) => ({
        value: String(option.duration),
        label: option.label || t('people.plans.months', { count: option.duration }),
      })),
    },
  ];
};
