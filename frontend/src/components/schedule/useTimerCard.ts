'use client';

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateSchedule } from '@/api/schedule.api';
import { useToastResult } from '@/hooks/useToastResult';
import { toastError } from '@/utils/toast-error';

import { playAlarm, showSystemNotification } from './alarm';
import { timerElapsed, timerRemaining } from './schedule.utils';
import { useNow } from './useNow';

import type { Schedule, UpdateScheduleBody } from '@/schemas/schedule.schema';

export interface TimerCardState {
  remaining: number;
  /** 0-100 */
  progress: number;
  isRunning: boolean;
  isDone: boolean;
  /** Has run before (the play button says "Resume" instead of "Start") */
  hasStarted: boolean;
  saving: boolean;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: () => void;
}

const PERCENT = 100;

/**
 * Clock and actions of one timer. The time left is computed from the saved timestamps on every tick
 * (see timerElapsed), so it is correct after re-renders, reloads and sleeping tabs. When it reaches 0
 * the timer is saved as completed; the alarm sounds only if this card saw it running.
 */
export const useTimerCard = (timer: Schedule): TimerCardState => {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useUpdateSchedule();
  const toastResult = useToastResult();
  const isActive = timer.status === 'active';
  const now = useNow(isActive);
  const duration = timer.duration ?? 0;
  const remaining = timerRemaining(timer, now);
  const isDone = duration > 0 && remaining === 0;
  const sawRunning = useRef(false);
  const completing = useRef(false);

  useEffect(() => {
    if (remaining > 0) sawRunning.current = true;
  }, [remaining]);

  useEffect(() => {
    if (!isActive || !isDone || completing.current) return;
    completing.current = true;
    if (sawRunning.current) {
      playAlarm();
      showSystemNotification(t('schedule.timer.notificationTitle'), timer.title);
      toast.success(t('schedule.timer.completedToast', { title: timer.title }));
    }
    const body: UpdateScheduleBody = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      elapsedSeconds: duration,
    };
    void mutateAsync({ id: timer._id, body }).catch(toastError);
  }, [isActive, isDone, duration, mutateAsync, t, timer._id, timer.title]);

  const save = (body: UpdateScheduleBody, success?: string): void => {
    void toastResult(mutateAsync({ id: timer._id, body }), success);
  };

  return {
    remaining,
    progress: duration > 0 ? Math.min(PERCENT, ((duration - remaining) / duration) * PERCENT) : 0,
    isRunning: isActive && !isDone,
    isDone,
    hasStarted: (timer.elapsedSeconds ?? 0) > 0,
    saving: isPending,
    pause: () => {
      save({
        status: 'paused',
        elapsedSeconds: Math.min(duration, timerElapsed(timer, Date.now())),
      });
    },
    // The server stamps updatedAt: the clock counts on from the saved elapsed seconds
    resume: () => {
      save({ status: 'active' });
    },
    // As in the old page: back to the full time, stopped until Start is pressed
    reset: () => {
      save({ status: 'paused', elapsedSeconds: 0 });
    },
    stop: () => {
      if (isDone) save({ status: 'completed', elapsedSeconds: duration });
      else save({ status: 'cancelled' }, t('schedule.timer.stopped'));
    },
  };
};
