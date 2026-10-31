'use client';

import Grid from '@mui/material/Grid';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterSelect } from '@/components/common/FilterSelect';
import { PeopleSearchField } from '@/components/people/common/PeopleSearchField';

import { ROLE_KEY, USER_ROLES } from './user-utils';

import type { UserFilterKey, UserListParams } from '@/hooks/usePeopleUserParams';
import type { FC } from 'react';

interface UsersBasicFiltersProps {
  params: UserListParams;
  onChange: (changes: Partial<Record<UserFilterKey, string>>) => void;
}

const CELL = { xs: 12, sm: 6, lg: 3 } as const;

/** Search (name or email) and role: the filters every manager has. */
export const UsersBasicFilters: FC<UsersBasicFiltersProps> = ({ params, onChange }) => {
  const { t } = useTranslation();
  const onSearch = useCallback(
    (search: string) => {
      onChange({ search });
    },
    [onChange],
  );

  return (
    <>
      <Grid size={CELL}>
        <PeopleSearchField
          label={t('common.search')}
          placeholder={t('people.users.searchPlaceholder')}
          value={params.search}
          onSearch={onSearch}
        />
      </Grid>
      <Grid size={CELL}>
        <FilterSelect
          label={t('people.users.role')}
          value={params.role}
          allLabel={t('people.users.allRoles')}
          options={USER_ROLES.map((role) => ({
            value: role,
            label: t(`people.roles.${ROLE_KEY[role]}`),
          }))}
          onChange={(role) => {
            onChange({ role });
          }}
        />
      </Grid>
    </>
  );
};
