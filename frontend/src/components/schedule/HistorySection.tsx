'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSchedules } from '@/api/schedule.api';
import { QueryState } from '@/components/common/QueryState';

import { HistoryList } from './HistoryList';
import { HistoryTypeTabs } from './HistoryTypeTabs';
import { completedReminderSeconds } from './schedule.utils';
import { TotalBadge } from './TotalBadge';

import type { ScheduleType } from '@/schemas/schedule.schema';

/** "History" tab: completed timers and reminders (filtered by type), with totals and delete. */
export const HistorySection = () => {
  const { t } = useTranslation();
  const [type, setType] = useState<ScheduleType>('timer');
  const timers = useSchedules({ type: 'timer', status: 'completed' });
  const reminders = useSchedules({ type: 'reminder', status: 'completed' });
  const timerItems = timers.data ?? [];
  const reminderItems = reminders.data ?? [];
  const isTimer = type === 'timer';
  const total = isTimer
    ? timerItems.reduce((sum, item) => sum + (item.duration ?? 0), 0)
    : reminderItems.reduce((sum, item) => sum + completedReminderSeconds(item), 0);

  return (
    <QueryState
      isLoading={timers.isLoading || reminders.isLoading}
      error={timers.error ?? reminders.error}
      onRetry={() => {
        void timers.refetch();
        void reminders.refetch();
      }}
      isEmpty={timerItems.length === 0 && reminderItems.length === 0}
      emptyText={t('schedule.history.empty')}
    >
      <HistoryTypeTabs
        value={type}
        timerCount={timerItems.length}
        reminderCount={reminderItems.length}
        onChange={setType}
      />
      <TotalBadge
        label={isTimer ? t('schedule.history.totalTimers') : t('schedule.history.totalReminders')}
        seconds={total}
        color={isTimer ? 'primary' : 'warning'}
      />
      <HistoryList
        items={isTimer ? timerItems : reminderItems}
        emptyText={
          isTimer ? t('schedule.history.emptyTimers') : t('schedule.history.emptyReminders')
        }
      />
    </QueryState>
  );
};
