'use client';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface FilterStatusChipsProps {
  /** Courses listed (undefined while loading) */
  count: number | undefined;
  /** Filters in use */
  active: number;
  onClear: () => void;
}

/** Course count, "N filters active" and "Clear filters" in the filter panel header. */
export const FilterStatusChips: FC<FilterStatusChipsProps> = ({ count, active, onClear }) => {
  const { t } = useTranslation();
  return (
    <>
      {count !== undefined && (
        <Chip
          label={t('adminCourses.filter.count', { count })}
          size="small"
          color={active > 0 ? 'primary' : 'default'}
          sx={{ fontWeight: 800 }}
        />
      )}
      {active > 0 && (
        <>
          <Chip
            label={t('adminCourses.filter.active', { count: active })}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 800 }}
          />
          <Button size="small" onClick={onClear} sx={{ minHeight: 44 }}>
            {t('adminCourses.filter.clear')}
          </Button>
        </>
      )}
    </>
  );
};
