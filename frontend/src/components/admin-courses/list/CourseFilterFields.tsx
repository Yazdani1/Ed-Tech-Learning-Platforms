'use client';

import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { CourseSearchField } from '@/components/course-card/CourseSearchField';

import { ACTIVITY_FILTERS, type CourseFilterKey, type CourseFilters } from './course-filters';
import { FilterSelect, type FilterOption } from '@/components/common/FilterSelect';
import { useReferenceOptions } from './useReferenceOptions';

import type { FC } from 'react';

interface CourseFilterFieldsProps {
  filters: CourseFilters;
  onChange: (key: CourseFilterKey, value: string) => void;
  /** Moderators only see published courses, so they get no status filter */
  showStatus: boolean;
}

interface SelectConfig {
  key: CourseFilterKey;
  /** i18n keys under adminCourses.filter */
  label: string;
  all: string;
  options: readonly FilterOption[];
}

const CELL = { xs: 12, sm: 6, lg: 2.4 } as const;

/** The dropdowns of the filter panel, in display order (no status filter for Moderators). */
const useFilterSelects = (showStatus: boolean): SelectConfig[] => {
  const { t } = useTranslation();
  const options = useReferenceOptions();
  const activity = (group: 'enrollment' | 'earning'): FilterOption[] =>
    ACTIVITY_FILTERS.map((value) => ({
      value,
      label: t(`adminCourses.filter.${group}.${value}`),
    }));
  const selects: SelectConfig[] = [
    { key: 'courseType', label: 'courseType', all: 'allCourseTypes', options: options.courseTypes },
    { key: 'category', label: 'category', all: 'allCategories', options: options.categories },
    { key: 'teacher', label: 'teacher', all: 'allTeachers', options: options.teachers },
    ...(showStatus
      ? [{ key: 'status', label: 'status', all: 'allStatuses', options: options.statuses } as const]
      : []),
    { key: 'pricing', label: 'pricing', all: 'allPricing', options: options.pricings },
    { key: 'visibility', label: 'visibility', all: 'allVisibility', options: options.visibilities },
    { key: 'subscriptionPlans', label: 'plan', all: 'allPlans', options: options.plans },
    {
      key: 'enrollmentFilter',
      label: 'enrollmentActivity',
      all: 'enrollment.all',
      options: activity('enrollment'),
    },
    {
      key: 'earningFilter',
      label: 'earningActivity',
      all: 'earning.all',
      options: activity('earning'),
    },
  ];
  return selects;
};

/** The search box and the dropdowns of the staff course filter panel. */
export const CourseFilterFields: FC<CourseFilterFieldsProps> = ({
  filters,
  onChange,
  showStatus,
}) => {
  const { t } = useTranslation();
  const selects = useFilterSelects(showStatus);

  return (
    <Grid container spacing={2}>
      <Grid size={CELL}>
        <CourseSearchField
          value={filters.search}
          onSearch={(value) => {
            onChange('search', value);
          }}
          placeholder={t('adminCourses.filter.search')}
          label={t('adminCourses.filter.searchLabel')}
        />
      </Grid>
      {selects.map((select) => (
        <Grid key={select.key} size={CELL}>
          <FilterSelect
            label={t(`adminCourses.filter.${select.label}`)}
            allLabel={t(`adminCourses.filter.${select.all}`)}
            value={filters[select.key]}
            options={select.options}
            onChange={(value) => {
              onChange(select.key, value);
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
};
