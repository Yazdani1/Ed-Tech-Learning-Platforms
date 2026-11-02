'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import type { StudentSubscription } from '@/schemas/students.schema';
import type { FC } from 'react';

interface StudentSubscriptionListProps {
  subscriptions: readonly StudentSubscription[];
}

/** Every subscription of the student: plan, period, status and amount paid. */
export const StudentSubscriptionList: FC<StudentSubscriptionListProps> = ({ subscriptions }) => {
  const { t, i18n } = useTranslation();
  if (subscriptions.length === 0) {
    return <Typography color="text.secondary">{t('people.students.noSubscriptions')}</Typography>;
  }
  return (
    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1 }}>
      {subscriptions.map((subscription) => (
        <Box
          component="li"
          key={subscription._id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            p: 1.25,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {subscription.plan}
              {subscription.billingLabel ? ` · ${subscription.billingLabel}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('people.students.subscriptionPeriod', {
                start: formatDate(subscription.startDate, i18n.language),
                end: formatDate(subscription.endDate, i18n.language),
              })}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>{formatBdt(subscription.amountPaid)}</Typography>
            <Chip
              size="small"
              variant="outlined"
              label={t(`people.students.status.${subscription.status}`, {
                defaultValue: subscription.status,
              })}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};
