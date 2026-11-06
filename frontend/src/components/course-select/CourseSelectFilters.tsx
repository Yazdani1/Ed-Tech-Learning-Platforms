'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useCategories } from '@/api/catalog.api';
import { FilterSelect } from '@/components/common/FilterSelect';
import { SearchField } from '@/components/common/SearchField';

import type { CourseSelectFilterState } from './useCourseSelectFilters';
import type { FC } from 'react';

interface CourseSelectFiltersProps {
  state: CourseSelectFilterState;
  /** Promos: the pricing filter is fixed to Paid */
  paidOnly: boolean;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
  gap: 1.5,
  my: 1.5,
} as const;

/** Title search and the category, visibility and pricing filters of the course list. */
export const CourseSelectFilters: FC<CourseSelectFiltersProps> = ({ state, paidOnly }) => {
  const { t } = useTranslation();
  const categories = useCategories();
  const { filters, set } = state;
  const paid = { value: 'Paid', label: t('catalog.basic.paid') };
  return (
    <>
      <SearchField
        value={filters.search}
        onChange={(value) => {
          set('search', value);
        }}
        label={t('promos.courses.search')}
        placeholder={t('promos.courses.search')}
      />
      <Box sx={GRID_SX}>
        <FilterSelect
          label={t('promos.courses.category')}
          value={filters.category}
          allLabel={t('common.all')}
          options={(categories.data ?? []).map((item) => ({ value: item._id, label: item.name }))}
          onChange={(value) => {
            set('category', value);
          }}
        />
        <FilterSelect
          label={t('promos.courses.visibility')}
          value={filters.visibility}
          allLabel={t('common.all')}
          options={[
            { value: 'Public', label: t('catalog.basic.public') },
            { value: 'Private', label: t('catalog.basic.private') },
          ]}
          onChange={(value) => {
            set('visibility', value);
          }}
        />
        <FilterSelect
          label={t('promos.courses.pricing')}
          value={filters.pricing}
          allLabel={paidOnly ? undefined : t('common.all')}
          options={paidOnly ? [paid] : [{ value: 'Free', label: t('catalog.basic.free') }, paid]}
          onChange={(value) => {
            if (!paidOnly) set('pricing', value);
          }}
        />
      </Box>
    </>
  );
};
