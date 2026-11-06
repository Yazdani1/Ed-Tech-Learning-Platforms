'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useAdminCourses } from '@/api/admin-courses.api';

import { CourseCheckList } from './CourseCheckList';
import { CourseSelectFilters } from './CourseSelectFilters';
import { useCourseSelectFilters } from './useCourseSelectFilters';

import type { FC } from 'react';

interface CourseMultiSelectProps {
  value: readonly string[];
  onChange: (ids: string[]) => void;
  /** Promos: paid courses only (the pricing filter is then fixed) */
  paidOnly?: boolean;
}

/**
 * Published courses to choose from: search, filters (category, visibility, pricing), "select all shown",
 * one row per course with a tick box, cover, title and batch number. Used by the promo and announcement forms.
 */
export const CourseMultiSelect: FC<CourseMultiSelectProps> = ({
  value,
  onChange,
  paidOnly = false,
}) => {
  const { t } = useTranslation();
  const filters = useCourseSelectFilters(paidOnly);
  const courses = useAdminCourses(filters.params);
  const rows = courses.data ?? [];
  const selected = new Set(value);
  const allShownTicked = rows.length > 0 && rows.every((row) => selected.has(row._id));

  const toggle = (id: string): void => {
    onChange(selected.has(id) ? value.filter((item) => item !== id) : [...value, id]);
  };
  const toggleShown = (): void => {
    const shown = rows.map((row) => row._id);
    onChange(
      allShownTicked
        ? value.filter((id) => !shown.includes(id))
        : [...new Set([...value, ...shown])],
    );
  };

  return (
    <Box>
      <CourseSelectFilters state={filters} paidOnly={paidOnly} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('promos.courses.selected', { count: value.length })}
        </Typography>
        <Button
          size="small"
          onClick={toggleShown}
          disabled={rows.length === 0}
          sx={{ minHeight: 44 }}
        >
          {t(allShownTicked ? 'promos.courses.unselectShown' : 'promos.courses.selectShown')}
        </Button>
      </Box>
      <CourseCheckList
        rows={rows}
        isPending={courses.isPending}
        error={courses.error}
        selected={selected}
        onToggle={toggle}
      />
    </Box>
  );
};
