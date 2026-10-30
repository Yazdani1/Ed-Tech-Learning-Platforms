'use client';

import { useTranslation } from 'react-i18next';

import { useCategories, useCourseTypes, useSubscriptionPlans } from '@/api/catalog.api';

import type { FilterOption } from './FilterCheckboxList';
import type { BrowseListKey } from '@/hooks/useBrowseParams';
import type { Taxonomy } from '@/schemas/catalog.schema';

export interface FilterGroup {
  key: BrowseListKey;
  label: string;
  options: FilterOption[];
  hint?: string;
  /** Long lists scroll inside their section */
  scroll: boolean;
}

const PRICING_VALUES = ['Free', 'Paid'] as const;

const toOptions = (items: Taxonomy[] | undefined): FilterOption[] =>
  (items ?? []).map((item) => ({ value: item._id, label: item.name }));

/** The checkbox groups of the filter panel (groups without options are left out). */
export const useFilterGroups = (): FilterGroup[] => {
  const { t } = useTranslation();
  const courseTypes = toOptions(useCourseTypes().data);
  const categories = toOptions(useCategories().data);
  const plans = (useSubscriptionPlans().data ?? []).map(({ plan }) => ({
    value: plan,
    label: plan,
  }));
  const groups: FilterGroup[] = [
    {
      key: 'courseTypes',
      label: t('browse.filters.courseType'),
      options: courseTypes,
      scroll: true,
    },
    { key: 'categories', label: t('browse.filters.category'), options: categories, scroll: true },
    {
      key: 'pricing',
      label: t('browse.filters.pricing'),
      options: PRICING_VALUES.map((value) => ({ value, label: t(`browse.filters.${value}`) })),
      scroll: false,
    },
    {
      key: 'subscriptionPlans',
      label: t('browse.filters.subscription'),
      hint: t('browse.filters.subscriptionHint'),
      options: plans,
      scroll: true,
    },
  ];
  return groups.filter((group) => group.options.length > 0);
};
