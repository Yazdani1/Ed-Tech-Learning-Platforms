'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseSearchField } from '@/components/course-card/CourseSearchField';

import { FilterCheckboxList } from './FilterCheckboxList';
import { FilterPanelHeader } from './FilterPanelHeader';
import { FilterSection } from './FilterSection';
import { useFilterGroups } from './useFilterGroups';

import type { BrowseParams } from '@/hooks/useBrowseParams';
import type { FilterCounts } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseFilterPanelProps {
  filters: BrowseParams;
  counts: FilterCounts | undefined;
}

const NO_COUNTS: Record<string, number> = {};

/** Search, course type, category, pricing and subscription-plan filters (sidebar on desktop, drawer on phones). */
export const CourseFilterPanel: FC<CourseFilterPanelProps> = ({ filters, counts }) => {
  const { t } = useTranslation();
  const groups = useFilterGroups();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <FilterPanelHeader
        activeFilterCount={filters.activeFilterCount}
        onClearAll={filters.clearAll}
      />
      <FilterSection label={t('browse.filters.search')}>
        <CourseSearchField
          value={filters.search}
          onSearch={filters.setSearch}
          placeholder={t('browse.filters.searchPlaceholder')}
          label={t('browse.filters.search')}
        />
      </FilterSection>
      {groups.map((group, index) => (
        <FilterSection key={group.key} label={group.label} last={index === groups.length - 1}>
          {group.hint && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {group.hint}
            </Typography>
          )}
          <FilterCheckboxList
            label={group.label}
            options={group.options}
            selected={filters.selected[group.key]}
            counts={counts?.[group.key] ?? NO_COUNTS}
            onToggle={(value) => {
              filters.toggle(group.key, value);
            }}
            scroll={group.scroll}
          />
        </FilterSection>
      ))}
    </Box>
  );
};
