'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSchedules, useUpdateSchedule } from '@/api/schedule.api';
import { toastError } from '@/utils/toast-error';

import { playAlarm, showSystemNotification } from './alarm';
import { isReminderDue } from './schedule.utils';
import { useNow } from './useNow';

export interface ReminderAlarmState {
  /** Title of the reminder whose alarm just went off (null when no alert is shown) */
  alarmTitle: string | null;
  dismiss: () => void;
}

/**
 * Watches my pending reminders while the schedule page is open: when one's start time arrives it is saved
 * as active (firedAt = now), the alarm sounds and an alert (plus a system notification, if allowed) shows.
 */
export const useReminderAlarms = (): ReminderAlarmState => {
  const { t } = useTranslation();
  const { data } = useSchedules({ type: 'reminder' });
  const { mutateAsync } = useUpdateSchedule();
  const hasPending = (data ?? []).some((item) => item.status === 'pending');
  const now = useNow(hasPending);
  const fired = useRef(new Set<string>());
  const [alarmTitle, setAlarmTitle] = useState<string | null>(null);

  useEffect(() => {
    // A reminder moved to a later start (edited) can go off again
    (data ?? []).forEach((item) => {
      if (item.status === 'pending' && !isReminderDue(item, now)) fired.current.delete(item._id);
    });
    const due = (data ?? []).filter(
      (item) => isReminderDue(item, now) && !fired.current.has(item._id),
    );
    if (due.length === 0) return;
    const firedAt = new Date().toISOString();
    due.forEach((item) => {
      fired.current.add(item._id);
      void mutateAsync({ id: item._id, body: { status: 'active', firedAt } }).catch(toastError);
    });
    const last = due[due.length - 1];
    if (!last) return;
    playAlarm();
    showSystemNotification(t('schedule.reminder.notificationTitle'), last.title);
    setAlarmTitle(last.title);
  }, [data, now, mutateAsync, t]);

  const dismiss = useCallback(() => {
    setAlarmTitle(null);
  }, []);

  return { alarmTitle, dismiss };
};
