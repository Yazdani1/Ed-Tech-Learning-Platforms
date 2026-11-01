'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { activeFilterCount, NO_FILTERS } from '../practice-quiz.utils';

import { PracticeCourseFilters } from './PracticeCourseFilters';

import type { FC } from 'react';
import type { PracticeCourseFilters as Filters } from '@/schemas/practice-quiz.schema';

interface PracticeCourseListHeaderProps {
  /** Null while the list loads */
  count: number | null;
  filters: Filters;
  onFiltersChange: (changes: Partial<Filters>) => void;
}

/** "Browse Free Quizzes", course and filter counts, the "Filter" toggle, "Clear All" and the filters. */
export const PracticeCourseListHeader: FC<PracticeCourseListHeaderProps> = ({
  count,
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(filters);
  return (
    <Box sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 800 }}>
            {t('quiz.practice.courses.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {count === null
              ? t('quiz.practice.courses.loading')
              : t('quiz.practice.courses.count', { count })}
            {' • '}
            {active > 0
              ? t('quiz.practice.courses.activeFilters', { count: active })
              : t('quiz.practice.courses.noFilters')}
          </Typography>
        </Box>
        <Button
          size="small"
          color="warning"
          variant={open ? 'contained' : 'outlined'}
          aria-expanded={open}
          startIcon={<FilterListIcon />}
          endIcon={<ExpandMoreIcon sx={{ transform: open ? 'rotate(180deg)' : undefined }} />}
          onClick={() => {
            setOpen((value) => !value);
          }}
          sx={{ minHeight: 44, textTransform: 'none', fontWeight: 800 }}
        >
          {t('quiz.practice.courses.filter')}
        </Button>
      </Box>
      {active > 0 && (
        <Button
          size="small"
          onClick={() => {
            onFiltersChange(NO_FILTERS);
          }}
          sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700 }}
        >
          {t('quiz.practice.courses.clearAll')}
        </Button>
      )}
      <Collapse in={open} unmountOnExit>
        <PracticeCourseFilters filters={filters} onChange={onFiltersChange} />
      </Collapse>
    </Box>
  );
};
