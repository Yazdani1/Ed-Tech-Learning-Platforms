'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { DetailItem } from '@/components/people/common/DetailItem';
import { formatDateTime } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import { SUBSCRIPTION_STATE_COLOR, getSubscriptionState } from './user-utils';

import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

interface UserDetailsGridProps {
  user: ManagedUser;
}

const NO_ENROLMENTS = { free: 0, paid: 0, subscription: 0, total: 0 };
const NO_SPENDING = { paidCourses: 0, subscriptions: 0, total: 0 };

/** The labelled facts of a user: id, email, enrolments, spending, subscription, dates. */
export const UserDetailsGrid: FC<UserDetailsGridProps> = ({ user }) => {
  const { t } = useTranslation();
  const enrolments = user.enrollmentSummary ?? NO_ENROLMENTS;
  const spending = user.spendingSummary ?? NO_SPENDING;
  const state = getSubscriptionState(user);
  const sub = user.activeSubscription;
  const dateOr = (value: string | null | undefined): string =>
    value ? formatDateTime(value) : t('people.notAvailable');

  const items: [string, React.ReactNode][] = [
    ['userId', user._id],
    ['email', user.email],
    ['totalEnrolled', enrolments.total],
    ['freeEnrolled', enrolments.free],
    ['paidPurchased', enrolments.paid],
    ['subscriptionEnrolled', enrolments.subscription],
    ['totalSpent', formatBdt(spending.total)],
    ['paidSpend', formatBdt(spending.paidCourses)],
    ['subSpend', formatBdt(spending.subscriptions)],
    ['subscriptionPlan', sub?.plan ?? t('people.users.noSubscription')],
    [
      'subscriptionStatus',
      <Chip
        key="status"
        label={t(`people.users.status.${state}`)}
        size="small"
        color={SUBSCRIPTION_STATE_COLOR[state]}
      />,
    ],
    ['subscriptionStart', dateOr(sub?.startDate)],
    ['subscriptionEnd', dateOr(sub?.endDate)],
    ['createdAt', dateOr(user.createdAt)],
    ['updatedAt', dateOr(user.updatedAt)],
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, 1fr)' },
        gap: 1.5,
      }}
    >
      {items.map(([key, value]) => (
        <DetailItem key={key} label={t(`people.users.${key}`)} value={value} />
      ))}
    </Box>
  );
};
