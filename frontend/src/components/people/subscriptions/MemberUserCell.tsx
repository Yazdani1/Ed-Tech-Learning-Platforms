'use client';

import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { SubscriptionRecord } from '@/schemas/people.schema';
import type { FC } from 'react';

interface MemberUserCellProps {
  record: SubscriptionRecord;
}

/** Member name and email ("Deleted user" when the account is gone). */
export const MemberUserCell: FC<MemberUserCellProps> = ({ record }) => {
  const { t } = useTranslation();
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
        {record.user?.name ?? t('people.subscriptions.deletedUser')}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
        {record.user?.email}
      </Typography>
    </>
  );
};
