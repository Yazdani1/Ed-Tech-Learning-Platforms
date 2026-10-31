'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategories, useCourseTypes, useSubscriptionPlans } from '@/api/catalog.api';
import { useTeachers } from '@/api/public.api';
import {
  COURSE_PRICINGS,
  COURSE_STATUSES,
  COURSE_VISIBILITIES,
} from '@/schemas/admin-courses.schema';

import type { FilterOption } from '@/components/common/FilterSelect';

export interface ReferenceOptions {
  categories: FilterOption[];
  courseTypes: FilterOption[];
  teachers: FilterOption[];
  /** Plan names (the value is the name, as courses store it) */
  plans: FilterOption[];
  statuses: FilterOption[];
  pricings: FilterOption[];
  visibilities: FilterOption[];
  isLoading: boolean;
}

const byName = (items: { _id: string; name: string }[] | undefined): FilterOption[] =>
  (items ?? []).map((item) => ({ value: item._id, label: item.name }));

/** Dropdown options shared by the filter panel and the bulk edit dialog (cached catalog reads). */
export const useReferenceOptions = (): ReferenceOptions => {
  const { t } = useTranslation();
  const categories = useCategories();
  const courseTypes = useCourseTypes();
  const teachers = useTeachers();
  const plans = useSubscriptionPlans();

  return useMemo(() => {
    const translated = (values: readonly string[]): FilterOption[] =>
      values.map((value) => ({ value, label: t(`adminCourses.values.${value}`) }));
    return {
      categories: byName(categories.data),
      courseTypes: byName(courseTypes.data),
      teachers: byName(teachers.data),
      plans: (plans.data ?? []).map((plan) => ({ value: plan.plan, label: plan.plan })),
      statuses: translated(COURSE_STATUSES),
      pricings: translated(COURSE_PRICINGS),
      visibilities: translated(COURSE_VISIBILITIES),
      isLoading:
        categories.isLoading || courseTypes.isLoading || teachers.isLoading || plans.isLoading,
    };
  }, [
    t,
    categories.data,
    courseTypes.data,
    teachers.data,
    plans.data,
    categories.isLoading,
    courseTypes.isLoading,
    teachers.isLoading,
    plans.isLoading,
  ]);
};
