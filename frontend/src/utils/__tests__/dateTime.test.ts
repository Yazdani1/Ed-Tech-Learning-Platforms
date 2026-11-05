import { Settings } from 'luxon';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  formatDate,
  isInPast,
  formatDateTime,
  formatPlainDate,
  formatPlainTime,
  formatBucketLabel,
  formatTime,
  fromLocalInput,
  isDateInput,
  toDateInput,
  toDateTimeInput,
} from '../dateTime';

// A fixed viewer: Dhaka (UTC+6, no daylight saving), English
const previousZone = Settings.defaultZone;
const previousLocale = Settings.defaultLocale;

beforeAll(() => {
  Settings.defaultZone = 'Asia/Dhaka';
  Settings.defaultLocale = 'en-US';
});

afterAll(() => {
  Settings.defaultZone = previousZone;
  Settings.defaultLocale = previousLocale;
});

const UTC_EVENING = '2026-10-29T20:30:00.000Z';

describe('dateTime', () => {
  it("shows UTC values in the viewer's zone (the next day in Dhaka)", () => {
    expect(formatDate(UTC_EVENING)).toBe('Oct 30, 2026');
    expect(formatTime(UTC_EVENING)).toBe('2:30 AM');
    expect(formatDateTime(UTC_EVENING)).toBe('Oct 30, 2026, 2:30 AM');
    expect(formatDate(new Date(UTC_EVENING))).toBe('Oct 30, 2026');
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('not a date')).toBe('');
    expect(formatDateTime('2026-13-45')).toBe('');
    expect(toDateTimeInput('garbage')).toBe('');
  });

  it('fills form inputs in local time and converts them back to UTC', () => {
    expect(toDateTimeInput(UTC_EVENING)).toBe('2026-10-30T02:30');
    expect(toDateInput(UTC_EVENING)).toBe('2026-10-30');
    expect(fromLocalInput('2026-10-30T02:30')).toBe(UTC_EVENING);
    expect(fromLocalInput('2026-10-30')).toBe('2026-10-29T18:00:00.000Z');
  });

  it('fromLocalInput gives null for empty or invalid input', () => {
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('tomorrow')).toBeNull();
  });

  it('shows plain (zone-less) dates and times as written', () => {
    expect(formatPlainDate('2026-10-30')).toBe('Friday, Oct 30, 2026');
    expect(formatPlainTime('14:05')).toBe('2:05 PM');
    expect(formatPlainTime('later')).toBe('later');
    expect(formatPlainDate('')).toBe('');
  });
});

describe('report helpers', () => {
  it('formats chart bucket keys as short labels', () => {
    expect(formatBucketLabel('2026-11-02T09', 'hour', 'en')).toBe('9 AM');
    expect(formatBucketLabel('2026-11-02', 'day', 'en')).toBe('Nov 2');
    expect(formatBucketLabel('2026-11', 'month', 'en')).toBe('Nov 2026');
    expect(formatBucketLabel('nonsense', 'day', 'en')).toBe('nonsense');
  });

  it('accepts only real yyyy-MM-dd days', () => {
    expect(isDateInput('2026-02-28')).toBe(true);
    expect(isDateInput('2026-02-30')).toBe(false);
    expect(isDateInput('02/28/2026')).toBe(false);
    expect(isDateInput('')).toBe(false);
  });
});

describe('isInPast', () => {
  it('is true only for a valid moment that has passed', () => {
    expect(isInPast('2000-01-01T00:00:00.000Z')).toBe(true);
    expect(isInPast('2999-01-01T00:00:00.000Z')).toBe(false);
    expect(isInPast(null)).toBe(false);
    expect(isInPast('not a date')).toBe(false);
  });
});
