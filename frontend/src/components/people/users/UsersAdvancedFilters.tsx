'use client';

import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { useSubscriptionPlans } from '@/api/catalog.api';
import { FilterSelect } from '@/components/common/FilterSelect';
import { NumberFilterField } from '@/components/people/common/NumberFilterField';

import type { UserFilterKey, UserListParams } from '@/hooks/usePeopleUserParams';
import type { FC } from 'react';

interface UsersAdvancedFiltersProps {
  params: UserListParams;
  onChange: (changes: Partial<Record<UserFilterKey, string>>) => void;
}

/** The fixed-choice selects: filter key, label key, "all" key and the option keys (people.users.*). */
const SELECTS = [
  {
    key: 'subscriptionStatus',
    label: 'subscriptionStatus',
    all: 'allStatuses',
    prefix: 'status',
    values: ['active', 'expired', 'inactive'],
  },
  {
    key: 'enrollmentFilter',
    label: 'enrollmentActivity',
    all: 'enrollment.all',
    prefix: 'enrollment',
    values: [
      'has_total',
      'none_total',
      'has_free',
      'none_free',
      'has_paid',
      'none_paid',
      'has_subscription',
      'none_subscription',
    ],
  },
  {
    key: 'spendingFilter',
    label: 'spendingActivity',
    all: 'spending.all',
    prefix: 'spending',
    values: [
      'has_total',
      'none_total',
      'has_paid_course',
      'none_paid_course',
      'has_subscription',
      'none_subscription',
    ],
  },
] as const;

const RANGE_FIELDS = [
  'minTotalSpent',
  'maxTotalSpent',
  'minPaidCourseSpend',
  'maxPaidCourseSpend',
  'minSubscriptionSpend',
  'maxSubscriptionSpend',
] as const;

const SELECT_CELL = { xs: 12, sm: 6, lg: 3 } as const;
const RANGE_CELL = { xs: 12, sm: 6, lg: 2 } as const;

/** Super Admin only: subscription plan and status, enrolment and spending activity, spend ranges. */
export const UsersAdvancedFilters: FC<UsersAdvancedFiltersProps> = ({ params, onChange }) => {
  const { t } = useTranslation();
  const plans = useSubscriptionPlans();

  return (
    <>
      <Grid size={SELECT_CELL}>
        <FilterSelect
          label={t('people.users.subscriptionPlan')}
          value={params.subscriptionPlan}
          allLabel={t('people.users.allPlans')}
          options={(plans.data ?? []).map((plan) => ({ value: plan.plan, label: plan.plan }))}
          onChange={(subscriptionPlan) => {
            onChange({ subscriptionPlan });
          }}
        />
      </Grid>
      {SELECTS.map((select) => (
        <Grid key={select.key} size={SELECT_CELL}>
          <FilterSelect
            label={t(`people.users.${select.label}`)}
            value={params[select.key]}
            allLabel={t(`people.users.${select.all}`)}
            options={select.values.map((value) => ({
              value,
              label: t(`people.users.${select.prefix}.${value}`),
            }))}
            onChange={(value) => {
              onChange({ [select.key]: value });
            }}
          />
        </Grid>
      ))}
      {RANGE_FIELDS.map((key) => (
        <Grid key={key} size={RANGE_CELL}>
          <NumberFilterField
            label={t(`people.users.range.${key}`)}
            value={params[key]}
            onCommit={(value) => {
              onChange({ [key]: value });
            }}
          />
        </Grid>
      ))}
    </>
  );
};
