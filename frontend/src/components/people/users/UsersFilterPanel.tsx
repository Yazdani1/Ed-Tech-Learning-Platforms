'use client';

import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { FilterPanel } from '@/components/people/common/FilterPanel';
import {
  ADVANCED_USER_FILTERS,
  BASIC_USER_FILTERS,
  type UserFilterKey,
  type UserListParams,
} from '@/hooks/usePeopleUserParams';

import { UsersAdvancedFilters } from './UsersAdvancedFilters';
import { UsersBasicFilters } from './UsersBasicFilters';

import type { FC } from 'react';

interface UsersFilterPanelProps {
  params: UserListParams;
  onChange: (changes: Partial<Record<UserFilterKey, string>>) => void;
  isSuperAdmin: boolean;
  activeCount: number;
  /** Undefined while the first page loads */
  resultCount: number | undefined;
  totalUsers: number | undefined;
}

/** "Filter users": search and role for everyone, plan / activity / spend ranges for a Super Admin. */
export const UsersFilterPanel: FC<UsersFilterPanelProps> = ({
  params,
  onChange,
  isSuperAdmin,
  activeCount,
  resultCount,
  totalUsers,
}) => {
  const { t } = useTranslation();
  const keys = isSuperAdmin
    ? [...BASIC_USER_FILTERS, ...ADVANCED_USER_FILTERS]
    : BASIC_USER_FILTERS;
  const summary =
    resultCount === undefined || totalUsers === undefined
      ? t('people.users.loadingSummary')
      : t(activeCount > 0 ? 'people.users.matchSummary' : 'people.users.availableSummary', {
          count: resultCount,
          total: totalUsers,
        });

  return (
    <FilterPanel
      title={t('people.users.filterTitle')}
      summary={summary}
      activeCount={activeCount}
      defaultOpen={activeCount > 0}
      onClear={() => {
        onChange(Object.fromEntries(keys.map((key) => [key, ''])));
      }}
      chips={
        totalUsers !== undefined && (
          <Chip label={t('people.users.totalChip', { count: totalUsers })} size="small" />
        )
      }
    >
      <Grid container spacing={2}>
        <UsersBasicFilters params={params} onChange={onChange} />
        {isSuperAdmin && <UsersAdvancedFilters params={params} onChange={onChange} />}
      </Grid>
    </FilterPanel>
  );
};
