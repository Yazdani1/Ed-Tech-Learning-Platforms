'use client';

import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useCategories, useCourseTypes } from '@/api/catalog.api';

import { PlanFilterSelect } from './PlanFilterSelect';

import type { Taxonomy } from '@/schemas/catalog.schema';
import type { PlanCourseFilters } from '@/schemas/public.schema';
import type { FC } from 'react';

interface PlanCoursesFiltersProps {
  value: PlanCourseFilters;
  onChange: (changes: Partial<PlanCourseFilters>) => void;
}

const SEARCH_SLOT_PROPS = {
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon fontSize="small" />
      </InputAdornment>
    ),
  },
};

const toOptions = (items: Taxonomy[] | undefined) =>
  (items ?? []).map((item) => ({ value: item._id, label: item.name }));

/** Search box and category / course type / pricing filters of the included-courses dialog. */
export const PlanCoursesFilters: FC<PlanCoursesFiltersProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const { data: courseTypes } = useCourseTypes();
  return (
    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="search"
          label={t('public.planCourses.search')}
          value={value.search}
          onChange={(event) => {
            onChange({ search: event.target.value });
          }}
          slotProps={SEARCH_SLOT_PROPS}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <PlanFilterSelect
          label={t('public.planCourses.category')}
          value={value.category}
          options={toOptions(categories)}
          onChange={(category) => {
            onChange({ category });
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <PlanFilterSelect
          label={t('public.planCourses.courseType')}
          value={value.courseType}
          options={toOptions(courseTypes)}
          onChange={(courseType) => {
            onChange({ courseType });
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 2 }}>
        <PlanFilterSelect
          label={t('public.planCourses.pricing')}
          value={value.pricing}
          options={[
            { value: 'Free', label: t('public.planCourses.free') },
            { value: 'Paid', label: t('public.planCourses.paid') },
          ]}
          onChange={(pricing) => {
            onChange({ pricing: pricing === 'Free' || pricing === 'Paid' ? pricing : '' });
          }}
        />
      </Grid>
    </Grid>
  );
};
