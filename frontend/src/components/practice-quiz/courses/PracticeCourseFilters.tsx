'use client';

import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { useCategories, useCourseTypes } from '@/api/catalog.api';
import { FilterSelect } from '@/components/common/FilterSelect';
import { CourseSearchField } from '@/components/course-card/CourseSearchField';

import type { FC } from 'react';
import type { PracticeCourseFilters as Filters } from '@/schemas/practice-quiz.schema';

interface PracticeCourseFiltersProps {
  filters: Filters;
  onChange: (changes: Partial<Filters>) => void;
}

const isPricing = (value: string): value is Filters['pricing'] =>
  value === '' || value === 'Free' || value === 'Paid';

/** Search, category, pricing and course type of the course list. */
export const PracticeCourseFilters: FC<PracticeCourseFiltersProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();
  const categories = useCategories();
  const courseTypes = useCourseTypes();
  const toOptions = (items: { _id: string; name: string }[] | undefined) =>
    (items ?? []).map((item) => ({ value: item._id, label: item.name }));

  return (
    <Stack spacing={1.5} sx={{ pt: 1 }}>
      <CourseSearchField
        value={filters.search}
        onSearch={(search) => {
          onChange({ search });
        }}
        placeholder={t('quiz.practice.courses.search')}
        label={t('quiz.practice.courses.searchLabel')}
      />
      <FilterSelect
        label={t('quiz.practice.courses.category')}
        allLabel={t('quiz.practice.courses.allCategories')}
        value={filters.categories}
        options={toOptions(categories.data)}
        onChange={(categories) => {
          onChange({ categories });
        }}
      />
      <FilterSelect
        label={t('quiz.practice.courses.pricing')}
        allLabel={t('quiz.practice.courses.allPricing')}
        value={filters.pricing}
        options={[
          { value: 'Free', label: t('quiz.practice.courses.freeOnly') },
          { value: 'Paid', label: t('quiz.practice.courses.paidOnly') },
        ]}
        onChange={(pricing) => {
          if (isPricing(pricing)) onChange({ pricing });
        }}
      />
      <FilterSelect
        label={t('quiz.practice.courses.courseType')}
        allLabel={t('quiz.practice.courses.allCourseTypes')}
        value={filters.courseTypes}
        options={toOptions(courseTypes.data)}
        onChange={(courseTypes) => {
          onChange({ courseTypes });
        }}
      />
    </Stack>
  );
};
