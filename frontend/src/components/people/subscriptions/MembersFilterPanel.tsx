'use client';

import Grid from '@mui/material/Grid';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterPanel } from '@/components/people/common/FilterPanel';
import { FilterSelect } from '@/components/common/FilterSelect';
import { PeopleSearchField } from '@/components/people/common/PeopleSearchField';
import {
  countMemberFilters,
  type SubscriptionUrlParams,
} from '@/hooks/usePeopleSubscriptionParams';

import { useMemberFilterSelects, type MemberFilterKey } from './useMemberFilterSelects';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface MembersFilterPanelProps {
  params: SubscriptionUrlParams;
  onChange: (changes: Partial<Record<MemberFilterKey, string>>) => void;
  plans: SubscriptionPlan[];
  /** Records in the current view; undefined while loading */
  total: number | undefined;
}

const SELECT_CELL = { xs: 12, sm: 4, md: 'grow' } as const;

/** "Filter members": search, plan, status and billing duration. */
export const MembersFilterPanel: FC<MembersFilterPanelProps> = ({
  params,
  onChange,
  plans,
  total,
}) => {
  const { t } = useTranslation();
  const activeCount = countMemberFilters(params);
  const onSearch = useCallback(
    (search: string) => {
      onChange({ search });
    },
    [onChange],
  );
  const selects = useMemberFilterSelects(plans);

  return (
    <FilterPanel
      title={t('people.subscriptions.filterTitle')}
      summary={
        total === undefined
          ? t('people.subscriptions.filterHint')
          : t('people.subscriptions.matchSummary', { count: total })
      }
      activeCount={activeCount}
      defaultOpen={activeCount > 0}
      onClear={() => {
        onChange({ search: '', plan: '', billingDuration: '', status: '' });
      }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <PeopleSearchField
            label={t('people.subscriptions.searchLabel')}
            placeholder={t('people.subscriptions.searchPlaceholder')}
            value={params.search}
            onSearch={onSearch}
          />
        </Grid>
        {selects.map((select) => (
          <Grid key={select.key} size={SELECT_CELL}>
            <FilterSelect
              label={select.label}
              value={params[select.key]}
              allLabel={select.allLabel}
              options={select.options}
              onChange={(value) => {
                onChange({ [select.key]: value });
              }}
            />
          </Grid>
        ))}
      </Grid>
    </FilterPanel>
  );
};
