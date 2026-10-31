'use client';

import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import { CancelSubscriptionButton } from './CancelSubscriptionButton';
import { MemberStatusChip } from './MemberStatusChip';
import { MemberUserCell } from './MemberUserCell';
import { planColor } from './plan-utils';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { SubscriptionRecord } from '@/schemas/people.schema';

const ACTIONS_WIDTH = 64;

type Column = DataColumn<SubscriptionRecord>;

/** Cancel button, only on active records. */
const ACTIONS_COLUMN: Column = {
  key: 'actions',
  header: '',
  align: 'right',
  width: ACTIONS_WIDTH,
  render: (record) =>
    record.status === 'Active' ? <CancelSubscriptionButton record={record} /> : null,
};

/** Columns of the member list (user, plan, billing, paid, status, dates, assigned by, cancel). */
export const useMemberColumns = (): Column[] => {
  const { t } = useTranslation();
  const billing = (record: SubscriptionRecord): string =>
    record.billingLabel ??
    (record.billingDuration ? t('people.plans.months', { count: record.billingDuration }) : '-');
  const plan = (record: SubscriptionRecord) => (
    <Chip
      label={record.plan}
      size="small"
      sx={{ bgcolor: planColor(record.plan), color: 'common.white', fontWeight: 600 }}
    />
  );

  return [
    {
      key: 'user',
      header: t('people.subscriptions.user'),
      render: (record) => <MemberUserCell record={record} />,
    },
    { key: 'plan', header: t('people.subscriptions.plan'), render: plan },
    { key: 'billing', header: t('people.subscriptions.billing'), render: billing },
    {
      key: 'paid',
      header: t('people.subscriptions.paid'),
      render: (record) =>
        typeof record.pricePaid === 'number' ? formatBdt(record.pricePaid) : '-',
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (record) => <MemberStatusChip record={record} />,
    },
    {
      key: 'start',
      header: t('people.subscriptions.startDate'),
      render: (record) => formatDate(record.startDate),
      hideOnMobile: true,
    },
    {
      key: 'end',
      header: t('people.subscriptions.endDate'),
      render: (record) => formatDate(record.endDate),
    },
    {
      key: 'assignedBy',
      header: t('people.subscriptions.assignedBy'),
      render: (record) => record.assignedBy?.name ?? t('people.subscriptions.self'),
      hideOnMobile: true,
    },
    ACTIONS_COLUMN,
  ];
};
