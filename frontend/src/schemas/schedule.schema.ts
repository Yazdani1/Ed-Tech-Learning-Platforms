import { z } from 'zod';

import { fromLocalInput } from '@/utils/dateTime';

export const scheduleTypeSchema = z.enum(['timer', 'reminder']);
export type ScheduleType = z.infer<typeof scheduleTypeSchema>;

export const scheduleStatusSchema = z.enum([
  'pending',
  'active',
  'paused',
  'completed',
  'cancelled',
]);
export type ScheduleStatus = z.infer<typeof scheduleStatusSchema>;

/** A timer or reminder as GET /api/study-schedules and every write return it (dates are UTC ISO strings). */
export const scheduleSchema = z.object({
  _id: z.string(),
  type: scheduleTypeSchema,
  title: z.string(),
  description: z.string().nullish(),
  status: scheduleStatusSchema,
  /** Timers: planned length in seconds */
  duration: z.number().nullish(),
  /** Timers: seconds already studied when the timer was last saved (paused, reset, completed) */
  elapsedSeconds: z.number().nullish(),
  completedAt: z.string().nullish(),
  /** Reminders */
  startDateTime: z.string().nullish(),
  endDateTime: z.string().nullish(),
  /** Reminders: when the alarm went off (the study stopwatch counts from here) */
  firedAt: z.string().nullish(),
  createdAt: z.string(),
  /** Last save; for an active timer this is the moment it (re)started counting */
  updatedAt: z.string(),
});
export type Schedule = z.infer<typeof scheduleSchema>;

export interface ScheduleFilters {
  type?: ScheduleType;
  status?: ScheduleStatus;
}

export interface CreateTimerInput {
  title: string;
  description: string;
  /** Seconds, > 0 */
  duration: number;
}

export interface CreateReminderInput {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime?: string;
}

/** PUT /api/study-schedules/:id body (every field optional; endDateTime null clears the end). */
export interface UpdateScheduleBody {
  status?: ScheduleStatus;
  elapsedSeconds?: number;
  completedAt?: string;
  firedAt?: string;
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string | null;
}

// ---- Forms ----

const TITLE_MAX = 200;
const MAX_HOURS = 23;
const MAX_MINUTES_OR_SECONDS = 59;

const titleField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .max(TITLE_MAX, 'schedule.form.titleTooLong');

export const durationValueSchema = z.object({
  hours: z.number().int().min(0).max(MAX_HOURS),
  minutes: z.number().int().min(0).max(MAX_MINUTES_OR_SECONDS),
  seconds: z.number().int().min(0).max(MAX_MINUTES_OR_SECONDS),
});
export type DurationValue = z.infer<typeof durationValueSchema>;

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export const durationToSeconds = ({ hours, minutes, seconds }: DurationValue): number =>
  hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds;

export const timerFormSchema = z.object({
  title: titleField,
  description: z.string().trim(),
  duration: durationValueSchema.refine((value) => durationToSeconds(value) > 0, {
    message: 'schedule.timer.durationRequired',
  }),
});
export type TimerForm = z.infer<typeof timerFormSchema>;

const reminderFields = z.object({
  title: titleField,
  description: z.string().trim(),
  /** datetime-local values in the viewer's zone */
  startDateTime: z.string().min(1, 'validation.required'),
  endDateTime: z.string(),
});
export type ReminderForm = z.infer<typeof reminderFields>;

const toMillis = (value: string): number | null => {
  const iso = fromLocalInput(value);
  return iso ? Date.parse(iso) : null;
};

/**
 * Reminder form rules: end after start (the backend's rule); a NEW reminder must also start in the
 * future (as in the old page). `now` is injectable for tests.
 */
export const makeReminderFormSchema = (requireFutureStart: boolean, now: () => number = Date.now) =>
  reminderFields.superRefine((values, ctx) => {
    const start = toMillis(values.startDateTime);
    if (values.startDateTime && start === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDateTime'],
        message: 'schedule.form.invalidDate',
      });
      return;
    }
    if (start !== null && requireFutureStart && start <= now()) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDateTime'],
        message: 'schedule.form.startInFuture',
      });
    }
    const end = values.endDateTime ? toMillis(values.endDateTime) : null;
    if (values.endDateTime && end === null) {
      ctx.addIssue({ code: 'custom', path: ['endDateTime'], message: 'schedule.form.invalidDate' });
      return;
    }
    if (start !== null && end !== null && end <= start) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDateTime'],
        message: 'schedule.form.endAfterStart',
      });
    }
  });
