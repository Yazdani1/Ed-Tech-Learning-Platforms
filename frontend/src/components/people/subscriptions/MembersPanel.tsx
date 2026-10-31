'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useSubscriptionPlans } from '@/api/catalog.api';
import { useSubscriptions } from '@/api/people.api';
import { AddButton } from '@/components/people/common/AddButton';
import { useModal } from '@/hooks/useModal';
import {
  toSubscriptionQuery,
  type SubscriptionUrlParams,
} from '@/hooks/usePeopleSubscriptionParams';

import { AssignSubscriptionModal } from './AssignSubscriptionModal';
import { MemberStatusTabs } from './MemberStatusTabs';
import { MembersFilterPanel } from './MembersFilterPanel';
import { MembersList } from './MembersList';

import type { UrlListParams } from '@/hooks/useUrlListParams';
import type { FC } from 'react';

interface MembersPanelProps {
  params: SubscriptionUrlParams;
  setParams: UrlListParams<SubscriptionUrlParams>['setParams'];
}

/** Subscription members: status tabs with counts, filters, the paged list, Assign and Cancel. */
export const MembersPanel: FC<MembersPanelProps> = ({ params, setParams }) => {
  const { t } = useTranslation();
  const plans = useSubscriptionPlans();
  const query = useSubscriptions(toSubscriptionQuery(params));
  const assignModal = useModal();
  const planList = plans.data ?? [];
  const onFilterChange = useCallback(
    (changes: Partial<Record<keyof SubscriptionUrlParams, string>>) => {
      setParams(changes);
    },
    [setParams],
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 280px' }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
            {t('people.subscriptions.membersTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('people.subscriptions.membersIntro')}
          </Typography>
        </Box>
        <AddButton
          label={t('people.subscriptions.assignTitle')}
          onClick={() => {
            assignModal.openModal();
          }}
          disabled={planList.length === 0}
        />
      </Box>
      <MemberStatusTabs
        value={params.status}
        onChange={(status) => {
          setParams({ status });
        }}
        counts={query.data?.statusCounts}
      />
      <MembersFilterPanel
        params={params}
        onChange={onFilterChange}
        plans={planList}
        total={query.data?.pagination.total}
      />
      <MembersList
        query={query}
        onPageChange={(page) => {
          setParams({ page });
        }}
      />
      <AssignSubscriptionModal
        open={assignModal.open}
        plans={planList}
        onClose={assignModal.closeModal}
      />
    </Box>
  );
};
