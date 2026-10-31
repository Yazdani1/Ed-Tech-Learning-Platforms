'use client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import { memberStatusSchema, type MemberStatus } from '@/schemas/people.schema';

import type { FC } from 'react';

interface MemberStatusTabsProps {
  value: MemberStatus;
  onChange: (status: string) => void;
  /** Records per status (undefined while loading) */
  counts: Record<MemberStatus, number> | undefined;
}

/** Active Members / Cancelled / Expired / All Records, each with its count. */
export const MemberStatusTabs: FC<MemberStatusTabsProps> = ({ value, onChange, counts }) => {
  const { t } = useTranslation();
  return (
    <Tabs
      value={value}
      onChange={(_event, status: string) => {
        onChange(status);
      }}
      variant="scrollable"
      allowScrollButtonsMobile
      aria-label={t('people.subscriptions.statusTabsLabel')}
      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      {memberStatusSchema.options.map((status) => (
        <Tab
          key={status}
          value={status}
          sx={{ minHeight: 48 }}
          label={`${t(`people.subscriptions.tabs.${status}`)}${counts ? ` (${counts[status]})` : ''}`}
        />
      ))}
    </Tabs>
  );
};
