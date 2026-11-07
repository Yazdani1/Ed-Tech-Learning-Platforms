import { DateTime } from 'luxon';

// Sales periods in the viewer's own time zone, sent to the backend as ISO date-times (from included, to excluded).

const MONTH_KEY = 'yyyy-LL';
const DAY_KEY = 'yyyy-LL-dd';
/** How many months the period dropdown offers (this month and the 11 before it) */
export const MONTH_OPTIONS = 12;

export interface DateRange {
  from?: string;
  to?: string;
}

export const isMonthKey = (value: string): boolean =>
  /^\d{4}-\d{2}$/.test(value) && DateTime.fromFormat(value, MONTH_KEY).isValid;

export const isDayKey = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromFormat(value, DAY_KEY).isValid;

/** "2026-11" -> 1 Nov 00:00 to 1 Dec 00:00 (local time). */
export const monthRange = (month: string): DateRange => {
  const start = DateTime.fromFormat(month, MONTH_KEY).startOf('month');
  if (!start.isValid) return {};
  return {
    from: start.toUTC().toISO(),
    to: start.plus({ months: 1 }).toUTC().toISO(),
  };
};

/** Days typed in the custom range: both days included. */
export const dayRange = (fromDay: string, toDay: string): DateRange => {
  const from = isDayKey(fromDay) ? DateTime.fromFormat(fromDay, DAY_KEY).startOf('day') : null;
  const to = isDayKey(toDay)
    ? DateTime.fromFormat(toDay, DAY_KEY).startOf('day').plus({ days: 1 })
    : null;
  return {
    ...(from && { from: from.toUTC().toISO() ?? undefined }),
    ...(to && { to: to.toUTC().toISO() ?? undefined }),
  };
};

/** This month and the months before it, newest first ("2026-11", "2026-10", ...). */
export const recentMonths = (count = MONTH_OPTIONS, now: DateTime = DateTime.local()): string[] =>
  Array.from({ length: count }, (_, index) =>
    now.startOf('month').minus({ months: index }).toFormat(MONTH_KEY),
  );

/** "November 2026" in the viewer's language. */
export const formatMonth = (month: string, locale?: string): string => {
  const date = DateTime.fromFormat(month, MONTH_KEY);
  return date.isValid ? date.setLocale(locale ?? 'en').toFormat('LLLL yyyy') : month;
};
