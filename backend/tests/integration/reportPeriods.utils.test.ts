import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import {
  bucketKey,
  bucketKeys,
  customRange,
  periodStarts,
  resolveTimeZone,
} from '../../src/utils/reportPeriods';
import { AppError } from '../../src/utils/AppError';

// utils/reportPeriods.ts: report periods and chart buckets in the viewer's time zone (fixed dates only).

const HOURS_IN_DAY = 24;
const MAX_CUSTOM_DAYS = 3660;

describe('resolveTimeZone', () => {
  it('falls back to UTC when no zone is sent', () => {
    expect(resolveTimeZone(undefined)).toBe('UTC');
    expect(resolveTimeZone('')).toBe('UTC');
    expect(resolveTimeZone('Asia/Dhaka')).toBe('Asia/Dhaka');
  });

  it.each([5, ['Asia/Dhaka'], { $ne: null }, 'Mars/Base'])('400 for %j', (value) => {
    expect(() => resolveTimeZone(value)).toThrow(AppError);
  });
});

describe('periodStarts', () => {
  it('starts today and this month at local midnight in the zone (Dhaka is UTC+6)', () => {
    // 20:00 UTC on 1 Nov = 02:00 on 2 Nov in Dhaka
    const starts = periodStarts('Asia/Dhaka', DateTime.fromISO('2026-11-01T20:00:00Z'));
    expect(starts.today.toISOString()).toBe('2026-11-01T18:00:00.000Z');
    expect(starts.week.toISOString()).toBe('2026-10-26T18:00:00.000Z');
    expect(starts.month.toISOString()).toBe('2026-10-31T18:00:00.000Z');
  });

  it('"last 7 days" crosses a month start (UTC)', () => {
    const starts = periodStarts('UTC', DateTime.fromISO('2026-03-01T00:30:00Z'));
    expect(starts.today.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(starts.week.toISOString()).toBe('2026-02-23T00:00:00.000Z');
    expect(starts.month.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });
});

describe('bucketKey / bucketKeys', () => {
  it('puts a moment in the viewer-zone hour, day and month', () => {
    const moment = new Date('2026-11-01T20:00:00Z');
    expect(bucketKey(moment, 'Asia/Dhaka', 'hour')).toBe('2026-11-02T02');
    expect(bucketKey(moment, 'Asia/Dhaka', 'day')).toBe('2026-11-02');
    expect(bucketKey(moment, 'UTC', 'day')).toBe('2026-11-01');
    expect(bucketKey(new Date('2026-10-31T19:00:00Z'), 'Asia/Dhaka', 'month')).toBe('2026-11');
  });

  it('lists every day and month between two moments, both included', () => {
    const days = bucketKeys(
      new Date('2026-10-30T00:00:00Z'),
      new Date('2026-11-02T10:00:00Z'),
      'UTC',
      'day',
    );
    expect(days).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    const months = bucketKeys(
      new Date('2026-01-15T00:00:00Z'),
      new Date('2026-03-02T00:00:00Z'),
      'UTC',
      'month',
    );
    expect(months).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('keeps one bucket per day and per hour across a daylight-saving change (New York)', () => {
    const zone = 'America/New_York';
    const start = DateTime.fromISO('2026-03-07T00:00', { zone }).toJSDate();
    const end = DateTime.fromISO('2026-03-09T23:59', { zone }).toJSDate();
    expect(bucketKeys(start, end, zone, 'day')).toEqual(['2026-03-07', '2026-03-08', '2026-03-09']);
    // 8 March 2026 has only 23 hours there (clocks jump from 02:00 to 03:00)
    const dayStart = DateTime.fromISO('2026-03-08T00:00', { zone });
    const hours = bucketKeys(dayStart.toJSDate(), dayStart.endOf('day').toJSDate(), zone, 'hour');
    expect(hours).toHaveLength(HOURS_IN_DAY - 1);
    expect(new Set(hours).size).toBe(hours.length);
  });
});

describe('customRange', () => {
  it('accepts a single day: start of the first day to the end of the last, in the zone', () => {
    const range = customRange('2026-10-05', '2026-10-05', 'Asia/Dhaka');
    expect(range.days).toBe(1);
    expect(range.start.toISOString()).toBe('2026-10-04T18:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-10-05T17:59:59.999Z');
  });

  it(`accepts ${MAX_CUSTOM_DAYS} days and refuses one more`, () => {
    const start = DateTime.fromISO('2010-01-01', { zone: 'UTC' });
    const last = start.plus({ days: MAX_CUSTOM_DAYS - 1 }).toFormat('yyyy-MM-dd');
    const tooFar = start.plus({ days: MAX_CUSTOM_DAYS }).toFormat('yyyy-MM-dd');
    expect(customRange('2010-01-01', last, 'UTC').days).toBe(MAX_CUSTOM_DAYS);
    expect(() => customRange('2010-01-01', tooFar, 'UTC')).toThrow('Date range is too long');
  });

  it.each([
    ['missing', undefined, '2026-01-01', 'Start and end dates are required'],
    ['not a string', ['2026-01-01'], '2026-01-02', 'Start and end dates are required'],
    ['a bad date', '2026-02-30', '2026-03-01', 'Invalid date'],
    ['another format', '01/02/2026', '2026-03-01', 'Invalid date'],
    ['reversed', '2026-03-02', '2026-03-01', 'The start date must be before the end date'],
  ])('400 for %s', (_name, from, to, message) => {
    expect(() => customRange(from, to, 'UTC')).toThrow(message);
  });
});
