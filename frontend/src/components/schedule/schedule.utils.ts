import type { Schedule } from '@/schemas/schedule.schema';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const PAD = 2;

const pad = (value: number): string => String(value).padStart(PAD, '0');

const splitSeconds = (totalSeconds: number): { h: number; m: number; s: number } => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return {
    h: Math.floor(safe / SECONDS_PER_HOUR),
    m: Math.floor((safe % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    s: safe % SECONDS_PER_MINUTE,
  };
};

/** "01:05:09" (digital clock) */
export const formatClock = (totalSeconds: number): string => {
  const { h, m, s } = splitSeconds(totalSeconds);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export interface DurationParts {
  h: number;
  m: number;
  s: number;
}

export const durationParts = (totalSeconds: number): DurationParts => splitSeconds(totalSeconds);

/** Whole seconds between two instants (never negative). */
export const secondsBetween = (fromMs: number, toMs: number): number =>
  Math.max(0, Math.floor((toMs - fromMs) / MS_PER_SECOND));

const parseMs = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
};

/**
 * Seconds a timer has run at `nowMs`, computed from timestamps (never by counting ticks), so it stays right
 * across re-renders, reloads and background tabs. An active timer's `updatedAt` is the moment it last
 * started counting (create, resume and reset each save it); `elapsedSeconds` is what it had before that.
 */
export const timerElapsed = (timer: Schedule, nowMs: number): number => {
  const saved = timer.elapsedSeconds ?? 0;
  if (timer.status !== 'active') return saved;
  const since = parseMs(timer.updatedAt);
  return since === null ? saved : saved + secondsBetween(since, nowMs);
};

/** Seconds left on a timer at `nowMs` (0 when done). */
export const timerRemaining = (timer: Schedule, nowMs: number): number =>
  Math.max(0, (timer.duration ?? 0) - timerElapsed(timer, nowMs));

/** Seconds until a pending reminder starts (0 when due). */
export const secondsUntilStart = (reminder: Schedule, nowMs: number): number => {
  const start = parseMs(reminder.startDateTime);
  return start === null ? 0 : secondsBetween(nowMs, start);
};

/** True when a pending reminder's start time has arrived. */
export const isReminderDue = (reminder: Schedule, nowMs: number): boolean => {
  const start = parseMs(reminder.startDateTime);
  return reminder.status === 'pending' && start !== null && start <= nowMs;
};

/** Study stopwatch of an active reminder: seconds since its alarm went off. */
export const reminderStudySeconds = (reminder: Schedule, nowMs: number): number => {
  const fired = parseMs(reminder.firedAt);
  return fired === null ? 0 : secondsBetween(fired, nowMs);
};

/** Time studied in a completed reminder: from the alarm to completion (or its end, or the last save). */
export const completedReminderSeconds = (reminder: Schedule): number => {
  const fired = parseMs(reminder.firedAt);
  const end =
    parseMs(reminder.completedAt) ?? parseMs(reminder.endDateTime) ?? parseMs(reminder.updatedAt);
  return fired === null || end === null ? 0 : secondsBetween(fired, end);
};

export const isOpenTimer = (item: Schedule): boolean =>
  item.status === 'active' || item.status === 'paused';

export const isOpenReminder = (item: Schedule): boolean =>
  item.status === 'pending' || item.status === 'active';
