'use client';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common/PageHeader';
import { usePeopleSubscriptionParams } from '@/hooks/usePeopleSubscriptionParams';

import { MembersPanel } from './MembersPanel';
import { PlansPanel } from './PlansPanel';

/** Two tabs: plan configuration and subscription members. */
export const SubscriptionsView = () => {
  const { t } = useTranslation();
  const { params, setParams } = usePeopleSubscriptionParams();

  return (
    <Box>
      <PageHeader title={t('people.subscriptions.title')} />
      <Tabs
        value={params.tab}
        onChange={(_event, tab: string) => {
          setParams({ tab });
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label={t('people.subscriptions.tabsLabel')}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="plans" label={t('people.subscriptions.plansTab')} sx={{ minHeight: 48 }} />
        <Tab value="members" label={t('people.subscriptions.membersTab')} sx={{ minHeight: 48 }} />
      </Tabs>
      {params.tab === 'plans' ? (
        <PlansPanel />
      ) : (
        <MembersPanel params={params} setParams={setParams} />
      )}
    </Box>
  );
};
