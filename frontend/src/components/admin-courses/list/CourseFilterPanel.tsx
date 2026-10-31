'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { countActiveFilters, type CourseFilterKey, type CourseFilters } from './course-filters';
import { CourseFilterFields } from './CourseFilterFields';
import { FilterStatusChips } from './FilterStatusChips';

import type { FC } from 'react';

interface CourseFilterPanelProps {
  filters: CourseFilters;
  onChange: (key: CourseFilterKey, value: string) => void;
  onClear: () => void;
  /** Courses currently listed (undefined while loading) */
  count: number | undefined;
  isModerator: boolean;
}

const HEADER_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
} as const;

/** "Filter courses" card: result summary, active filter count, clear, and the collapsible filters. */
export const CourseFilterPanel: FC<CourseFilterPanelProps> = ({
  filters,
  onChange,
  onClear,
  count,
  isModerator,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const active = countActiveFilters(filters);
  const prefix = isModerator ? 'publishedSummary' : 'summary';
  const summary =
    count === undefined
      ? t('adminCourses.filter.loading')
      : t(`adminCourses.filter.${prefix}${active > 0 ? 'Filtered' : ''}`, { count });

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Box sx={HEADER_SX}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 900 }}>
            {t('adminCourses.filter.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            {summary}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <FilterStatusChips count={count} active={active} onClear={onClear} />
          <Button
            size="small"
            variant="outlined"
            startIcon={<TuneIcon />}
            endIcon={
              <ExpandMoreIcon
                sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            }
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => {
              setOpen((current) => !current);
            }}
            sx={{ minHeight: 44 }}
          >
            {open ? t('adminCourses.filter.hide') : t('adminCourses.filter.show')}
          </Button>
        </Box>
      </Box>
      <Collapse in={open} id={regionId}>
        <Box sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
          <CourseFilterFields filters={filters} onChange={onChange} showStatus={!isModerator} />
        </Box>
      </Collapse>
    </Paper>
  );
};
