'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlanCourses } from '@/api/public.api';
import { AppModal } from '@/components/common/AppModal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import { PlanCoursesFilters } from './PlanCoursesFilters';
import { PlanCoursesResults } from './PlanCoursesResults';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { PlanCourseFilters } from '@/schemas/public.schema';
import type { FC } from 'react';

interface PlanCoursesModalProps {
  open: boolean;
  plan: SubscriptionPlan | undefined;
  onClose: () => void;
}

const EMPTY_FILTERS: PlanCourseFilters = { search: '', category: '', courseType: '', pricing: '' };

/** The courses included in one plan, with search and filters (opened from a plan card). */
export const PlanCoursesModal: FC<PlanCoursesModalProps> = ({ open, plan, onClose }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PlanCourseFilters>(EMPTY_FILTERS);
  const search = useDebouncedValue(filters.search);
  const { data, isPending, error, refetch } = usePlanCourses(open ? plan?.plan : undefined, {
    ...filters,
    search,
  });
  const hasFilter = [
    filters.search.trim(),
    filters.category,
    filters.courseType,
    filters.pricing,
  ].some((value) => value !== '');

  const close = (): void => {
    setFilters(EMPTY_FILTERS);
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={close}
      title={t('public.planCourses.title', { plan: plan?.plan ?? '' })}
      maxWidth="xl"
      cancelLabel={t('common.close')}
    >
      <PlanCoursesFilters
        value={filters}
        onChange={(changes) => {
          setFilters((current) => ({ ...current, ...changes }));
        }}
      />
      <PlanCoursesResults
        courses={data?.data ?? []}
        isPending={isPending}
        error={error}
        onRetry={() => void refetch()}
        hasFilter={hasFilter}
        onClearFilters={() => {
          setFilters(EMPTY_FILTERS);
        }}
      />
    </AppModal>
  );
};
