import { describe, expect, it } from 'vitest';

import { makeReminderFormSchema, timerFormSchema } from '@/schemas/schedule.schema';

import {
  completedReminderSeconds,
  formatClock,
  isReminderDue,
  reminderStudySeconds,
  secondsUntilStart,
  timerElapsed,
  timerRemaining,
} from '../schedule.utils';

import { makeSchedule } from './fixtures';

const NOW = Date.parse('2026-10-31T10:00:00.000Z');
const ago = (seconds: number): string => new Date(NOW - seconds * 1000).toISOString();
const inFuture = (seconds: number): string => new Date(NOW + seconds * 1000).toISOString();

describe('formatClock', () => {
  it('pads hours, minutes and seconds', () => {
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(3725)).toBe('01:02:05');
    expect(formatClock(-5)).toBe('00:00:00');
  });
});

describe('timer clock (from timestamps)', () => {
  it('an active timer adds the seconds since it last started to the saved elapsed time', () => {
    const timer = makeSchedule({
      status: 'active',
      duration: 600,
      elapsedSeconds: 100,
      updatedAt: ago(50),
    });
    expect(timerElapsed(timer, NOW)).toBe(150);
    expect(timerRemaining(timer, NOW)).toBe(450);
    // A later "now" (missed ticks, sleeping tab) gives the right value straight away
    expect(timerRemaining(timer, NOW + 60_000)).toBe(390);
  });

  it('a paused timer keeps its saved elapsed time', () => {
    const timer = makeSchedule({
      status: 'paused',
      duration: 600,
      elapsedSeconds: 100,
      updatedAt: ago(5000),
    });
    expect(timerRemaining(timer, NOW)).toBe(500);
  });

  it('never goes below zero, and a server clock ahead of the browser counts as zero', () => {
    const done = makeSchedule({
      status: 'active',
      duration: 60,
      elapsedSeconds: 0,
      updatedAt: ago(120),
    });
    expect(timerRemaining(done, NOW)).toBe(0);
    const ahead = makeSchedule({
      status: 'active',
      duration: 60,
      elapsedSeconds: 0,
      updatedAt: inFuture(3),
    });
    expect(timerRemaining(ahead, NOW)).toBe(60);
  });
});

describe('reminder clocks', () => {
  it('counts down to the start and knows when a pending reminder is due', () => {
    const upcoming = makeSchedule({
      type: 'reminder',
      status: 'pending',
      startDateTime: inFuture(90),
    });
    expect(secondsUntilStart(upcoming, NOW)).toBe(90);
    expect(isReminderDue(upcoming, NOW)).toBe(false);
    const due = makeSchedule({ type: 'reminder', status: 'pending', startDateTime: ago(1) });
    expect(isReminderDue(due, NOW)).toBe(true);
    expect(isReminderDue({ ...due, status: 'active' }, NOW)).toBe(false);
  });

  it('measures study time from the alarm', () => {
    const active = makeSchedule({ type: 'reminder', status: 'active', firedAt: ago(75) });
    expect(reminderStudySeconds(active, NOW)).toBe(75);
    const done = makeSchedule({
      type: 'reminder',
      status: 'completed',
      firedAt: ago(600),
      completedAt: ago(0),
      endDateTime: inFuture(3600),
    });
    expect(completedReminderSeconds(done)).toBe(600);
    expect(completedReminderSeconds({ ...done, firedAt: null })).toBe(0);
  });
});

describe('form schemas', () => {
  it('a timer needs a title and a duration above zero', () => {
    const result = timerFormSchema.safeParse({
      title: ' ',
      description: '',
      duration: { hours: 0, minutes: 0, seconds: 0 },
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toEqual(['validation.required', 'schedule.timer.durationRequired']);
  });

  it('a reminder end must be after its start; a new one must start in the future', () => {
    const now = () => Date.parse('2026-10-31T10:00:00');
    const create = makeReminderFormSchema(true, now);
    const past = create.safeParse({
      title: 'Exam',
      description: '',
      startDateTime: '2026-10-31T09:00',
      endDateTime: '2026-10-31T08:00',
    });
    expect(past.error?.issues.map((issue) => issue.message)).toEqual([
      'schedule.form.startInFuture',
      'schedule.form.endAfterStart',
    ]);
    const edit = makeReminderFormSchema(false, now);
    expect(
      edit.safeParse({
        title: 'Exam',
        description: '',
        startDateTime: '2026-10-31T09:00',
        endDateTime: '',
      }).success,
    ).toBe(true);
  });
});
