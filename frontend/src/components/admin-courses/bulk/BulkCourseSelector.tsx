'use client';

import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseSearchField } from '@/components/course-card/CourseSearchField';

import { FilterSelect } from '@/components/common/FilterSelect';

import { BulkCourseRow } from './BulkCourseRow';
import { SelectAllBar } from './SelectAllBar';

import type { FilterOption } from '@/components/common/FilterSelect';
import type { ReferenceOptions } from '../list/useReferenceOptions';
import type { BulkSelection, SelectorFilterKey } from './useBulkSelection';
import type { FC } from 'react';

interface BulkCourseSelectorProps {
  selection: BulkSelection;
  options: ReferenceOptions;
}

const LIST_MAX_HEIGHT = { xs: 320, md: 'calc(90vh - 360px)' } as const;
type SelectorSelect = [key: SelectorFilterKey, label: string, options: FilterOption[]];

/** Left side of the bulk dialog: search, filters, select all, and the course checkboxes. */
export const BulkCourseSelector: FC<BulkCourseSelectorProps> = ({ selection, options }) => {
  const { t } = useTranslation();
  const { filters, setFilter, visible, selectedIds } = selection;
  const selects: SelectorSelect[] = [
    ['status', 'status', options.statuses],
    ['visibility', 'visibility', options.visibilities],
    ['pricing', 'pricing', options.pricings],
    ['category', 'category', options.categories],
    ['courseType', 'courseType', options.courseTypes],
  ];

  return (
    <Box component="section" aria-label={t('adminCourses.bulk.selectorLabel')} sx={{ minWidth: 0 }}>
      <Box sx={{ p: 2, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <CourseSearchField
          value={filters.search}
          onSearch={(value) => {
            setFilter('search', value);
          }}
          placeholder={t('adminCourses.filter.search')}
          label={t('adminCourses.filter.searchLabel')}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          {selects.map(([key, label, list]) => (
            <FilterSelect
              key={key}
              label={t(`adminCourses.filter.${label}`)}
              allLabel={t('adminCourses.bulk.all')}
              value={filters[key]}
              options={list}
              onChange={(value) => {
                setFilter(key, value);
              }}
            />
          ))}
        </Box>
      </Box>
      <SelectAllBar selection={selection} />
      <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto' }}>
        {visible.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <SchoolOutlinedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.25 }} aria-hidden />
            <Typography variant="body2">{t('adminCourses.bulk.noMatch')}</Typography>
          </Box>
        ) : (
          visible.map((course) => (
            <BulkCourseRow
              key={course._id}
              course={course}
              checked={selectedIds.has(course._id)}
              onToggle={selection.toggleOne}
            />
          ))
        )}
      </Box>
    </Box>
  );
};
